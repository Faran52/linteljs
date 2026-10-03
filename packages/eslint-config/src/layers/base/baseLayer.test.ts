import {
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { rules as lintelRules } from '@linteljs/eslint-plugin';
import {
  codeLines,
  enabledRuleIdsFor,
  fixedTextFor,
  frameworkRuleIdsFor,
  functionOf,
  ownBlockNames,
  ruleEntryFor,
  ruleIdsFor,
  ruleIdsForFile,
  ruleNamesFor,
} from '@mocks/lintText';
import { layerWithout, layerWithoutConfig } from '@mocks/presets';
import importX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import astro from '../../frameworks/astro/astroFramework';

import base from './baseLayer';

import type sonarjs from 'eslint-plugin-sonarjs';
import type { Layer } from '../../types';

interface FlatConfigsBearing {
  flatConfigs: object;
}

interface ConfigsBearing {
  configs: object;
}

const TS_FILE = 'src/lib/utils/sample.ts';

describe('base: stylistic', () => {
  it('reports a line past 120 columns', async () => {
    const long = `export const value = '${'x'.repeat(130)}';`;

    const ruleIds = ruleIdsFor(base(), long, TS_FILE);
    await expect(ruleIds).resolves.toContain('@stylistic/max-len');
  });

  it('exempts a line that is only a long attribute value', async () => {
    const path = `  d="${'M10 3.22l-.61-.6a5.5 5.5 0 0 0-7.666.105 '.repeat(30)}"`;

    const ruleIds = ruleIdsFor(base(), `const svg = \`\n${path}\n\`;\n`, TS_FILE);

    await expect(ruleIds)
      .resolves.not.toContain('@stylistic/max-len');
  });

  it('still reports real code that happens to sit beside one', async () => {
    const long = `export const d = "x" + '${'y'.repeat(130)}';`;

    const ruleIds = ruleIdsFor(base(), long, TS_FILE);
    await expect(ruleIds).resolves.toContain('@stylistic/max-len');
  });

  it.each([
    [
      'reports a double-quoted string',
      'export const value = "x";\n',
      '@stylistic/quotes',
    ],
    [
      'reports a missing trailing comma in a multiline literal',
      'export const value = {\n  a: 1,\n  b: 2\n};\n',
      '@stylistic/comma-dangle',
    ],
    [
      'reports a half-split pair of object properties',
      'export const value = { a: 1,\n  b: 2 };\n',
      '@linteljs/member-newline',
    ],
    [
      'reports a brace left hanging on a single property',
      'export const value = { a: 1\n};\n',
      '@stylistic/object-curly-newline',
    ],
    [
      'reports a same-line else',
      'export const pick = (flag) => {\n  if (flag) {\n    return 1;\n  } else {\n    return 2;\n  }\n};\n',
      '@stylistic/brace-style',
    ],
    [
      'reports a block kept on one line, which the preset allows',
      'export const pick = (flag) => {\n  if (flag) { return 1; }\n\n  return 2;\n};\n',
      '@stylistic/brace-style',
    ],
  ])('%s', async (_title, code, rule) => {
    const ruleIds = ruleIdsFor(base(), code, TS_FILE);

    await expect(ruleIds).resolves.toContain(rule);
  });

  it.each([
    [
      'an object literal',
      'export const value = {\n  a: 1, b: 2, c: 3,\n};\n',
      'export const value = {\n  a: 1,\n  b: 2,\n  c: 3,\n};\n',
    ],
    [
      'a type literal',
      'export type Read = (token: { type: string; value: string; line: number }) => string;\n',
      'export type Read = (token: {\n  type: string;\n  value: string;\n  line: number;\n}) => string;\n',
    ],
    [
      'an interface body',
      'export interface Token { type: string; value: string; line: number }\n',
      'export interface Token {\n  type: string;\n  value: string;\n  line: number;\n}\n',
    ],
  ])('splits three members of %s one per line, braces included', async (_, code, expected) => {
    const fixed = await fixedTextFor(base(), code, TS_FILE);

    expect(fixed).toBe(expected);
  });

  it('leaves two object properties on one line', async () => {
    const reported = await ruleIdsFor(base(), 'export const value = { a: 1, b: 2 };\n', TS_FILE);

    expect(reported).toEqual([]);
  });

  it('leaves an import to the newline rules that own it', async () => {
    const code = "import { alpha, bravo } from 'mod';\n\nexport const value = alpha + bravo;\n";
    const reported = await ruleIdsFor(base(), code, TS_FILE);

    expect(reported).not.toContain('@stylistic/object-property-newline');
    expect(reported).not.toContain('@stylistic/object-curly-newline');
  });

  it('exempts a line whose length is a URL', async () => {
    const code = `// https://example.com/${'a'.repeat(130)}\nexport const value = 1;\n`;

    const ruleIds = ruleIdsFor(base(), code, TS_FILE);
    await expect(ruleIds).resolves.not.toContain('@stylistic/max-len');
  });

  it('lets a string take the other quote rather than escape one', async () => {
    const ruleIds = ruleIdsFor(base(), 'export const value = "it\'s";\n', TS_FILE);

    await expect(ruleIds)
      .resolves.not.toContain('@stylistic/quotes');
  });

  it('lets one property sit between braces on their own lines', async () => {
    const ruleIds = ruleIdsFor(base(), 'export const value = {\n  a: 1,\n};\n', TS_FILE);

    await expect(ruleIds)
      .resolves.not.toContain('@stylistic/object-curly-newline');
  });

  it('lets one member sit between braces on their own lines in a type literal and an interface', async () => {
    const literal = await ruleIdsFor(base(), 'export type Value = {\n  a: number;\n};\n', TS_FILE);
    const body = await ruleIdsFor(base(), 'export interface Value {\n  a: number;\n}\n', TS_FILE);

    expect(literal).not.toContain('@stylistic/object-curly-newline');
    expect(body).not.toContain('@stylistic/object-curly-newline');
  });

  it('ends every member of a multiline type with a semicolon, the last one included', async () => {
    const comma = 'export interface Shape {\n  a: string,\n  b: string;\n}\n';
    const bareLast = 'export interface Shape {\n  a: string;\n  b: string\n}\n';
    const closed = 'export interface Shape {\n  a: string;\n  b: string;\n}\n';

    const commaRuleIds = ruleIdsFor(base(), comma, TS_FILE);
    await expect(commaRuleIds).resolves.toContain('@stylistic/member-delimiter-style');
    const bareLastRuleIds = ruleIdsFor(base(), bareLast, TS_FILE);
    await expect(bareLastRuleIds).resolves.toContain('@stylistic/member-delimiter-style');
    const closedRuleIds = ruleIdsFor(base(), closed, TS_FILE);
    await expect(closedRuleIds).resolves.not.toContain('@stylistic/member-delimiter-style');
  });

  it('separates a one-line type with semicolons and leaves its last member bare', async () => {
    const comma = 'export const value = (shape: { a: string, b: string }) => shape;\n';
    const bareLast = 'export const value = (shape: { a: string; b: string }) => shape;\n';

    const commaRuleIds = ruleIdsFor(base(), comma, TS_FILE);
    await expect(commaRuleIds).resolves.toContain('@stylistic/member-delimiter-style');
    const bareLastRuleIds = ruleIdsFor(base(), bareLast, TS_FILE);
    await expect(bareLastRuleIds).resolves.not.toContain('@stylistic/member-delimiter-style');
  });

  it.each([
    [
      '@stylistic/semi-style',
      'export const a = 1\n;[1].forEach(String);\n',
      TS_FILE,
    ],
    [
      '@stylistic/function-call-argument-newline',
      'export const a = Math.max(1,\n  2, 3);\n',
      TS_FILE,
    ],
    [
      '@stylistic/function-paren-newline',
      'export const a = Math.max(1,\n  2);\n',
      TS_FILE,
    ],
    [
      '@stylistic/no-extra-semi',
      'export const a = 1;;\n',
      TS_FILE,
    ],
    [
      '@stylistic/switch-colon-spacing',
      'export const pick = (v) => {\n  switch (v) {\n    case 1 :\n      return 1;\n  }\n\n  return 2;\n};\n',
      TS_FILE,
    ],
    [
      '@stylistic/function-call-spacing',
      'export const a = String (1);\n',
      TS_FILE,
    ],
    [
      '@stylistic/linebreak-style',
      'export const a = 1;\r\n',
      TS_FILE,
    ],
    [
      'no-debugger',
      'debugger;\n',
      TS_FILE,
    ],
    [
      '@stylistic/padding-line-between-statements',
      'export const pick = (flag) => {\n  const value = 1;\n  if (flag) {\n    return value;\n  }\n  return 2;\n};\n',
      TS_FILE,
    ],
    [
      'object-shorthand',
      'const a = 1;\n\nexport const o = { a: a };\n',
      TS_FILE,
    ],
    [
      'object-shorthand',
      'export const o = { Box: function () {\n  return 1;\n} };\n',
      TS_FILE,
    ],
    [
      '@stylistic/switch-colon-spacing',
      'export const pick = (v) => {\n  switch (v) {\n    case 1:return 1;\n  }\n\n  return 2;\n};\n',
      TS_FILE,
    ],
  ])('reports %s on %j', async (rule, code, file) => {
    const ids = await ruleIdsFor(base(), code, file);

    expect(ids).toContain(rule);
  });

  it.each([
    ['a quoted key', "const id = 1;\n\nexport const o = { 'id': id };\n"],
    ['an arrow with a block body', 'export const o = { a: () => {\n  return 1;\n} };\n'],
  ])('leaves object-shorthand quiet on %s', async (_shape, code) => {
    const ids = await ruleIdsFor(base(), code, TS_FILE);

    expect(ids).not.toContain('object-shorthand');
  });

  it('leaves a barrel of re-exports packed, since a blank line between them never settles', async () => {
    const code = "export { a } from './a';\nexport { b } from './b';\n";
    const ids = await ruleIdsFor(base(), code, 'src/lib/index.ts');

    expect(ids).not.toContain('@stylistic/padding-line-between-statements');
  });

  it('reports a braceless if', async () => {
    const code = 'export const pick = (flag) => {\n  if (flag) return 1;\n\n  return 2;\n};\n';

    const ruleIds = ruleIdsFor(base(), code, TS_FILE);
    await expect(ruleIds).resolves.toContain('curly');
  });
});

describe('base: ignores', () => {
  const doubleQuoted = 'export const value = "x";\n';
  const built = 'src/generated/bundle.js';

  it('lints a path no ignore covers', async () => {
    const ruleIds = await ruleIdsFor(base(), doubleQuoted, built);
    expect(ruleIds).toContain('@stylistic/quotes');
  });

  it('reports nothing under a path the ignore list covers', async () => {
    const config = base({ ignores: ['src/generated/**'] });
    const ruleIds = await ruleIdsFor(config, doubleQuoted, built);
    expect(ruleIds).not.toContain('@stylistic/quotes');
  });

  it('reports nothing under a path only .gitignore covers', async () => {
    const prefix = join(tmpdir(), 'linteljs-gitignore-');
    const tempDir = await mkdtemp(prefix);
    const root = await realpath(tempDir);

    await writeFile(join(root, '.gitignore'), 'dist\n');

    const spy = vi.spyOn(process, 'cwd').mockReturnValue(root);

    try {
      const ruleIds = await ruleIdsFor(base(), doubleQuoted, join(root, 'dist/bundle.js'));
      expect(ruleIds).not.toContain('@stylistic/quotes');
    }
    finally {
      spy.mockRestore();

      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });

  it('names every block it writes', async () => {
    const prefix = join(tmpdir(), 'linteljs-names-');
    const tempDir = await mkdtemp(prefix);
    const root = await realpath(tempDir);

    await writeFile(join(root, '.gitignore'), 'dist\n');

    const spy = vi.spyOn(process, 'cwd').mockReturnValue(root);

    try {
      const config = base({
        ignores: ['build/**'],
        naming: { 'src/**/*.ts': 'CAMEL_CASE' },
      });
      const names = ownBlockNames(config);

      const baseBlocks = names
        .filter((name) => {
          return name.startsWith('@linteljs/base');
        });

      const expected = [
        '@linteljs/base/gitignore',
        '@linteljs/base/ignores',
        '@linteljs/base/typescript-syntax',
        '@linteljs/base',
        '@linteljs/base/typescript-rules',
        '@linteljs/base/scripts',
        '@linteljs/base/fixtures',
        '@linteljs/base/component-size',
        '@linteljs/base/utils-size',
        '@linteljs/base/test-size',
        '@linteljs/base/magic-numbers',
        '@linteljs/base/expression-complexity',
        '@linteljs/base/name-before-use',
        '@linteljs/base/naming',
      ];
      expect(baseBlocks).toEqual(expected);
    }
    finally {
      spy.mockRestore();

      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });

  it('still builds a config where there is no .gitignore to read', async () => {
    const prefix = join(tmpdir(), 'linteljs-nogit-');
    const root = await mkdtemp(prefix);
    const spy = vi.spyOn(process, 'cwd').mockReturnValue(root);

    try {
      const gitignoreEntries = base()
        .filter((entry) => {
          return entry.name === '@linteljs/base/gitignore';
        });

      expect(gitignoreEntries).toEqual([]);
      const ruleIds = await ruleIdsFor(base(), doubleQuoted, built);
      expect(ruleIds).toContain('@stylistic/quotes');
    }
    finally {
      spy.mockRestore();

      await rm(root, {
        recursive: true,
        force: true,
      });
    }
  });
});

describe('base: quality', () => {
  it('reports a function declaration', async () => {
    const ruleIds = await ruleIdsFor(base(), 'export function foo() {\n  return 1;\n}\n', TS_FILE);
    expect(ruleIds).toContain('func-style');
  });

  it('reports console.log but not console.warn or console.error', async () => {
    const logRuleIds = await ruleIdsFor(base(), 'console.log(1);\n', TS_FILE);
    expect(logRuleIds).toContain('no-console');
    const warnRuleIds = await ruleIdsFor(base(), 'console.warn(1);\n', TS_FILE);
    expect(warnRuleIds).not.toContain('no-console');
    const errorRuleIds = await ruleIdsFor(base(), 'console.error(1);\n', TS_FILE);
    expect(errorRuleIds).not.toContain('no-console');
  });

  it('reports console.log in a .js file too', async () => {
    const ruleIds = await ruleIdsFor(base(), 'console.log(1);\n', 'src/tool.js');
    expect(ruleIds).toContain('no-console');
  });

  it('allows a fixture to execute a source string, and no source file to', async () => {
    const code = "import { runInThisContext } from 'node:vm';\n\nexport const run = (source: string): unknown => {\n"
      + '  return runInThisContext(source);\n};\n';

    const mocksRuleIds = await ruleIdsFor(base(), code, '__mocks__/chromeFixture.ts');
    expect(mocksRuleIds).not.toContain('sonarjs/code-eval');

    const nestedMocksRuleIds = await ruleIdsFor(base(), code, 'packages/app/__mocks__/chromeFixture.ts');
    expect(nestedMocksRuleIds).not.toContain('sonarjs/code-eval');

    const srcRuleIds = await ruleIdsFor(base(), code, 'src/runner.ts');
    expect(srcRuleIds).toContain('sonarjs/code-eval');
  });

  it('grants a fixture nothing beyond that one rule', async () => {
    const ruleIds = await ruleIdsFor(base(), 'console.log(1);\n', '__mocks__/chromeFixture.ts');
    expect(ruleIds).toContain('no-console');
  });

  it('allows console in a build script, and nowhere near it', async () => {
    const scriptRuleIds = await ruleIdsFor(base(), 'console.log(1);\n', 'scripts/generateIcons.js');
    expect(scriptRuleIds).not.toContain('no-console');

    const nestedScriptRuleIds = await ruleIdsFor(base(), 'console.log(1);\n', 'scripts/nested/build.ts');
    expect(nestedScriptRuleIds).not.toContain('no-console');

    const srcScriptsRuleIds = await ruleIdsFor(base(), 'console.log(1);\n', 'src/scripts/tool.ts');
    expect(srcScriptsRuleIds).toContain('no-console');
  });

  it('prefers destructuring in an object declaration only', async () => {
    const lines = [
      'const source = { width: 1, height: 2 };',
      'const pair = [1, 2];',
      'export const width = source.width;',
      'export const tall = source.height;',
      'export const first = pair[0];',
      'export let late = 0;',
      'late = source.width;',
      '',
    ];
    const code = lines.join('\n');
    const ruleIds = await ruleIdsFor(base(), code, 'src/tool.js');
    const reported = ruleIds
      .filter((ruleId) => {
        return ruleId === 'prefer-destructuring';
      });

    expect(reported).toHaveLength(1);
  });

  it('restates every prefer-destructuring option, and leaves the TypeScript twin to the typed layer', async () => {
    const entry = await ruleEntryFor(base(), TS_FILE, 'prefer-destructuring');
    const ruleNames = await ruleNamesFor(base(), TS_FILE);

    const expected = [
      2,
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      { enforceForRenamedProperties: false },
    ];
    expect(entry).toEqual(expected);

    expect(ruleNames).not.toContain('@typescript-eslint/prefer-destructuring');
  });
});

describe('base: unused imports', () => {
  it('reports the unused-imports rule and not the typescript-eslint one', async () => {
    const code = "import { join } from 'node:path';\n\nexport const value = 1;\n";
    const ruleIds = await ruleIdsFor(base(), code, TS_FILE);

    expect(ruleIds).toContain('unused-imports/no-unused-imports');
    expect(ruleIds).not.toContain('@typescript-eslint/no-unused-vars');
    expect(ruleIds).not.toContain('no-unused-vars');
  });

  it('forgives an unused parameter ahead of a used one, and reports one after the last used', async () => {
    const leading = await ruleIdsFor(base(), 'export const pick = (first, second) => second;\n', TS_FILE);
    const trailing = await ruleIdsFor(base(), 'export const pick = (first, second) => first;\n', TS_FILE);

    expect(leading).not.toContain('unused-imports/no-unused-vars');
    expect(trailing).toContain('unused-imports/no-unused-vars');
  });
});

describe('base: duplicate imports', () => {
  it('reports a type import beside a value import of the same module, to be merged inline', async () => {
    const code = "import type { ZodType } from 'zod';\nimport { z } from 'zod';\n\n"
      + 'export const value: ZodType = z.string();\n';

    const ruleIds = await ruleIdsFor(base(), code, TS_FILE);
    expect(ruleIds).toContain('import-x/no-duplicates');
  });
});

describe('base: restricted imports', () => {
  it('reports the compat entry and its subpaths, and leaves the core entry alone', async () => {
    const importing = (from: string): string => {
      return `import { sortBy } from '${from}';\n\nexport const run = sortBy;\n`;
    };

    const compatRuleIds = await ruleIdsFor(base(), importing('es-toolkit/compat'), TS_FILE);
    expect(compatRuleIds).toContain('no-restricted-imports');

    const compatSubpathRuleIds = await ruleIdsFor(base(), importing('es-toolkit/compat/array/sortBy'), TS_FILE);
    expect(compatSubpathRuleIds).toContain('no-restricted-imports');

    const toolkitRuleIds = await ruleIdsFor(base(), importing('es-toolkit'), TS_FILE);
    expect(toolkitRuleIds).not.toContain('no-restricted-imports');
  });
});

describe('base: linteljs rules', () => {
  it.each([
    [
      'reports union-newline',
      'export type Value = { a: string } | { b: string };\n',
      '@linteljs/union-newline',
    ],
    [
      'reports chain-call-newline',
      'export const names = (users: string[]): string[] => users.filter(Boolean).map(String);\n',
      '@linteljs/chain-call-newline',
    ],
    [
      'reports interface-order',
      'export const value = 1;\n\nexport interface Shape {\n  a: string;\n}\n',
      '@linteljs/interface-order',
    ],
  ])('%s', async (_title, code, rule) => {
    const ruleIds = ruleIdsFor(base(), code, TS_FILE);

    await expect(ruleIds).resolves.toContain(rule);
  });

  it('reports nothing on a chain split one call per line', async () => {
    const code = 'export const names = (users: string[]): string[] => {\n  return users\n    .filter(Boolean)\n'
      + '    .map((user) => {\n      return user.trim();\n    });\n};\n';

    const ruleIds = ruleIdsFor(base(), code, TS_FILE);
    await expect(ruleIds).resolves.toEqual([]);
  });

  it('reports a second interface of one name in a scope, and not a global augmentation', async () => {
    const code = 'export interface Shape {\n  a: string;\n}\n\nexport interface Shape {\n  b: string;\n}\n\n'
      + 'declare global {\n  interface Shape {\n    c: string;\n  }\n}\n';
    const ruleIds = await ruleIdsFor(base(), code, TS_FILE);
    const reported = ruleIds
      .filter((ruleId) => {
        return ruleId === '@linteljs/no-duplicate-interface';
      });

    expect(reported).toHaveLength(1);
  });

  const TYPESCRIPT_RULE_IDS = Object.entries(lintelRules)
    .filter(([, rule]) => {
      return rule.meta.docs.language === 'typescript';
    })
    .map(([name]) => {
      return `@linteljs/${name}`;
    });

  it.each([
    'src/lib/utils/sample.ts',
    'src/lib/utils/sample.js',
    'src/components/Card.tsx',
    'src/components/Card.vue',
  ])('enables no framework rule on %s, JSX layout and sonarjs React and Vue rules included', async (file) => {
    const leaked = await frameworkRuleIdsFor(base(), file);

    expect(leaked).toStrictEqual([]);
  });

  it('has more than one TypeScript-only rule to restate, so the assertions below are not vacuous', () => {
    expect(TYPESCRIPT_RULE_IDS.length).toBeGreaterThan(1);
  });

  it('leaves every TypeScript-only rule off a plain .js file', async () => {
    const names = await ruleNamesFor(base(), 'src/lib/utils/sample.js');

    for (const ruleId of TYPESCRIPT_RULE_IDS) {
      const state = String(names.includes(ruleId));
      expect(`${ruleId}: ${state}`).toBe(`${ruleId}: false`);
    }
  });

  it('keeps every one of them on for TypeScript and for an SFC, which is why they are restated at all', async () => {
    const files = [
      'src/lib/utils/sample.ts',
      'src/components/Card.vue',
      'src/components/Card.svelte',
    ];

    for (const file of files) {
      const enabled = await enabledRuleIdsFor(base(), file);

      for (const ruleId of TYPESCRIPT_RULE_IDS) {
        const state = String(enabled.includes(ruleId));
        expect(`${file} ${ruleId}: ${state}`).toBe(`${file} ${ruleId}: true`);
      }
    }
  });
});

describe('base: astro', () => {
  it('gives a .astro file every rule a TypeScript file gets, on request', async () => {
    const script = await enabledRuleIdsFor(base(), 'src/lib/utils/sample.ts');
    const astroConfig = base({ astro: true });
    const component = await enabledRuleIdsFor(astroConfig, 'src/pages/index.astro');
    const unordered = new Set(component);

    expect(unordered).toEqual(new Set(script));
  });

  it('lints the frontmatter of a .astro file only on request', async () => {
    const page = '---\nfunction title() {\n  return 1;\n}\n---\n\n<h1>{title()}</h1>\n';
    const requestedConfig = [...base({ astro: true }), ...astro()];
    const requested = await ruleIdsFor(requestedConfig, page, 'src/pages/index.astro');
    const unrequestedConfig = [...base(), ...astro()];
    const unrequested = await ruleIdsFor(unrequestedConfig, page, 'src/pages/index.astro');

    expect(requested).toContain('func-style');
    expect(unrequested).not.toContain('func-style');
  });
});

describe('base: module hygiene', () => {
  const ownFile = join(import.meta.dirname, '../../../__mocks__/fixtures/typed/unused.ts');

  it.each([
    ['import-x/no-self-import', "import { greet } from './unused';\n\nexport const again = greet;\n"],
    ['import-x/no-useless-path-segments', "import { greet } from '../typed/unused';\n\nexport const again = greet;\n"],
    ['import-x/no-absolute-path', "import { greet } from '/unused';\n\nexport const again = greet;\n"],
    ['import-x/no-mutable-exports', 'export let count = 0;\n'],
    ['import-x/no-commonjs', 'module.exports = { count: 0 };\n'],
    ['import-x/no-amd', "define(['dependency'], (dependency) => {\n  return dependency;\n});\n"],
  ])('reports %s', async (ruleId, code) => {
    const ruleIds = await ruleIdsFor(base(), code, ownFile);

    expect(ruleIds).toContain(ruleId);
  });

  it('leaves a require to @typescript-eslint/no-require-imports', async () => {
    const code = "const dependency = require('dependency');\n\nexport const value = dependency;\n";
    const ruleIds = await ruleIdsFor(base(), code, ownFile);

    expect(ruleIds).not.toContain('import-x/no-commonjs');
  });

  it.each([
    ['import-x/no-self-import', [2]],
    ['import-x/no-useless-path-segments', [2, { noUselessIndex: false }]],
    ['import-x/no-absolute-path', [2]],
    ['import-x/no-mutable-exports', [2]],
    ['import-x/no-commonjs', [2, {
      allowRequire: true,
      allowPrimitiveModules: false,
    }]],
    ['import-x/no-amd', [2]],
  ])('sets %s with its options', async (ruleId, expected) => {
    const entry = await ruleEntryFor(base(), TS_FILE, ruleId);

    expect(entry).toEqual(expected);
  });
});

describe('base: import-x/no-cycle', () => {
  const entry = join(import.meta.dirname, '../../../__mocks__/fixtures/cycle/a.cts');

  it('reports a two-file cycle across .cts files', async () => {
    const actual = await ruleIdsForFile(base(), entry);
    expect(actual).toContain('import-x/no-cycle');
  });

  it('does not report the same cycle under the hand-written settings block it replaces', async () => {
    const handWritten: Layer = [
      {
        files: ['**/*.{ts,tsx,mts,cts}'],
        languageOptions: { parser: tseslint.parser },
      },
      {
        plugins: { 'import-x': importX },
        settings: {
          'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
          'import-x/resolver': { typescript: { alwaysTryTypes: true } },
        },
        rules: { 'import-x/no-cycle': 'error' },
      },
    ];

    const actual = await ruleIdsForFile(handWritten, entry);
    expect(actual).toEqual([]);
  });
});

describe('base: resolver options', () => {
  const RESOLVER_DEFAULTS = { alwaysTryTypes: true };

  const settingsOf = (layer: Layer) => {
    return layer
      .find((block) => {
        return block.settings?.['import-x/resolver'] !== undefined;
      })?.settings;
  };

  it('tries declaration files by default, and keeps the upstream parser settings', () => {
    const settings = settingsOf(base());

    const expected = { typescript: RESOLVER_DEFAULTS };
    expect(settings?.['import-x/resolver']).toEqual(expected);
    expect(settings).toHaveProperty('import-x/parsers');
    expect(settings).toHaveProperty('import-x/extensions');
    expect(settings).toHaveProperty('import-x/external-module-folders');
  });

  it('points the resolver at a named tsconfig when one is supplied, keeping the defaults', () => {
    const config = base({ resolver: { project: 'packages/*/tsconfig.json' } });
    const settings = settingsOf(config);

    const expected = {
      typescript: {
        ...RESOLVER_DEFAULTS,
        project: 'packages/*/tsconfig.json',
      },
    };
    expect(settings?.['import-x/resolver']).toEqual(expected);

    expect(settings).toHaveProperty('import-x/parsers');
  });

  it('passes through the conditions a project asks for', () => {
    const conditionNames = ['import', 'types'];
    const config = base({ resolver: { conditionNames } });
    const settings = settingsOf(config);

    const expected = {
      typescript: {
        ...RESOLVER_DEFAULTS,
        conditionNames,
      },
    };
    expect(settings?.['import-x/resolver']).toEqual(expected);
  });

  it('passes noWarnOnMultipleProjects through only when asked', () => {
    const config = base({
      resolver: {
        project: 'packages/*/tsconfig.json',
        noWarnOnMultipleProjects: true,
      },
    });
    const settings = settingsOf(config);

    const expected = {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: 'packages/*/tsconfig.json',
          noWarnOnMultipleProjects: true,
        },
      },
    };
    expect(settings).toMatchObject(expected);

    const resolverSettings = settingsOf(base());
    const expectedResolver = { 'import-x/resolver': { typescript: { alwaysTryTypes: true } } };
    expect(resolverSettings).toMatchObject(expectedResolver);
  });
});

describe('base: presets', () => {
  const loadBase = async (): Promise<() => Layer> => {
    const baseLayer = await import('./baseLayer');
    return baseLayer.base;
  };

  it('names the import-x preset when the plugin stops publishing it', async () => {
    const layer = await layerWithout('eslint-plugin-import-x', (plugin: FlatConfigsBearing) => {
      const patchedPlugin = {
        ...plugin,
        flatConfigs: {
          ...plugin.flatConfigs,
          typescript: undefined,
        },
      };
      return patchedPlugin;
    }, loadBase);

    expect(layer).toThrow('import-x/typescript is not published');
  });

  it('names the sonarjs preset when the plugin publishes no configs at all', async () => {
    const layer = await layerWithout('eslint-plugin-sonarjs', (plugin: typeof sonarjs) => {
      const patchedPlugin = {
        ...plugin,
        configs: undefined,
      };
      return patchedPlugin;
    }, loadBase);

    expect(layer).toThrow('sonarjs/recommended is not published');
  });

  it('names the stylistic preset when the plugin stops building it', async () => {
    const layer = await layerWithout('@stylistic/eslint-plugin', (plugin: ConfigsBearing) => {
      const patchedPlugin = {
        ...plugin,
        configs: {
          ...plugin.configs,
          customize: () => {
            return undefined;
          },
        },
      };
      return patchedPlugin;
    }, loadBase);

    expect(layer).toThrow('stylistic/customize is not published');
  });

  it('names the linteljs preset when the plugin stops publishing it', async () => {
    const layer = await layerWithoutConfig('@linteljs/eslint-plugin', 'flat/recommended', loadBase);

    expect(layer).toThrow('@linteljs/flat/recommended is not published');
  });
});

describe('base: magic numbers', () => {
  const RULE = '@typescript-eslint/no-magic-numbers';
  const MAGIC = 'export const wait = (ms) => ms * 1000;\n';

  it.each([
    ['src/timer.ts', true],
    ['src/timer.js', true],
    ['src/timer.test.ts', false],
    ['__mocks__/timer.ts', false],
    ['e2e/timer.ts', false],
    ['vite.config.ts', false],
    ['src/constants.ts', false],
  ])('in %s, reports a bare number: %s', async (file, reported) => {
    const ruleIds = await ruleIdsFor(base(), MAGIC, file);
    const reports = ruleIds.includes(RULE);

    expect(reports).toBe(reported);
  });

  it.each([
    ['a small integer', 'export const next = (n: number): number => n * 2 - 1;\n'],
    ['an array index', 'export const second = (list: number[]): number | undefined => list[3];\n'],
    ['a default value', 'export const pad = (width = 8): number => width;\n'],
    ['a const', 'export const LIMIT = 40;\n'],
    ['an object property', 'export const widths = { label: 14 };\n'],
    ['an enum member', 'export enum Code { Interrupted = 130 }\n'],
    ['a numeric literal type', 'export type Port = 80 | 443;\n'],
    ['a class field initial value', 'export class Box {\n  size = 64;\n}\n'],
    ['a readonly class property', 'export class Box {\n  readonly size = 64;\n}\n'],
    ['a type index', "export type Fourth = ['a', 'b', 'c', 'd'][3];\n"],
  ])('accepts %s', async (_shape, code) => {
    const ruleIds = await ruleIdsFor(base(), code, 'src/shape.ts');

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain(RULE);
  });

  it('reports a number assigned to a let', async () => {
    const ruleIds = await ruleIdsFor(base(), 'export let limit = 40;\n', 'src/shape.ts');

    expect(ruleIds).toContain(RULE);
  });
});

describe('base: expression complexity', () => {
  const RULE = 'sonarjs/expression-complexity';
  const FOUR = 'export const any = (a, b, c, d, e) => a && b && c && d && e;\n';
  const THREE = 'export const any = (a, b, c, d) => a && b && c && d;\n';

  it.each([
    ['src/check.ts', true],
    ['src/check.js', true],
    ['src/check.test.ts', false],
    ['__mocks__/check.ts', false],
    ['e2e/check.ts', false],
  ])('in %s, reports four operators in one expression: %s', async (file, reported) => {
    const ruleIds = await ruleIdsFor(base(), FOUR, file);
    const reports = ruleIds.includes(RULE);

    expect(reports).toBe(reported);
  });

  it('accepts three operators in one expression', async () => {
    const ruleIds = await ruleIdsFor(base(), THREE, 'src/check.ts');

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain(RULE);
  });
});

describe('base: name before use', () => {
  const RULE = '@linteljs/name-before-use';
  const UNNAMED = [
    'export const check = async (load) => {',
    '  if (await load()) {',
    '    load();',
    '  }',
    '};',
    '',
  ].join('\n');

  it.each([
    'src/check.ts',
    'src/check.js',
    'src/check.test.ts',
  ])('reports an await in a condition in %s', async (file) => {
    const ruleIds = await ruleIdsFor(base(), UNNAMED, file);

    expect(ruleIds).toContain(RULE);
  });

  it('reports a literal reached through an operator in an argument', async () => {
    const code = 'export const run = (go, source) => go(source ?? [source]);\n';
    const ruleIds = await ruleIdsFor(base(), code, 'src/shape.ts');

    expect(ruleIds).toContain(RULE);
  });

  it.each([
    ['an empty literal', 'export const listOf = (items) => items ?? [];\n'],
    ['a literal passed to a call', 'export const pair = new Set([1, 2]);\n'],
  ])('accepts %s', async (_shape, code) => {
    const ruleIds = await ruleIdsFor(base(), code, 'src/shape.ts');

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain(RULE);
  });
});

describe('base: size', () => {
  it('counts no IIFE as a function', async () => {
    const ruleIds = await ruleIdsFor(base(), `(() => {\n${codeLines(351, '  ')}})();\n`, TS_FILE);

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain('max-lines-per-function');
  });

  const FILE_RULE = 'max-lines';
  const FUNCTION_RULE = 'max-lines-per-function';

  it.each([
    ['src/app/format.ts', 500],
    ['src/app/format.js', 500],
    ['src/components/button/Button.tsx', 350],
    ['src/components/button/Button.jsx', 350],
    ['src/lib/utils/formatUtils.ts', 800],
    ['src/lib/utils/format.ts', 800],
    ['packages/core/src/rules/utils/nested/jsxUtils.ts', 800],
  ])('caps %s at %i lines of code', async (path, max) => {
    const atLimit = await ruleIdsFor(base(), codeLines(max), path);
    const overLimit = await ruleIdsFor(base(), codeLines(max + 1), path);

    expect(atLimit).not.toContain(FILE_RULE);
    expect(overLimit).toContain(FILE_RULE);
  });

  it.each([
    ['src/app/format.ts', 500],
    ['src/components/button/Button.tsx', 350],
    ['src/lib/utils/formatUtils.ts', 800],
  ])('counts neither blank lines nor comments in %s', async (path, max) => {
    const padded = `${codeLines(max)}\n\n// a note\n/*\n * a block\n */\n`;
    const ruleIds = await ruleIdsFor(base(), padded, path);

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain(FILE_RULE);
  });

  it.each([
    'src/app/run.ts',
    'src/app/run.js',
    'src/lib/utils/runUtils.ts',
  ])('caps a function in %s at 350 lines', async (path) => {
    const atLimit = await ruleIdsFor(base(), functionOf(350), path);
    const overLimit = await ruleIdsFor(base(), functionOf(351), path);

    expect(atLimit).not.toContain(FUNCTION_RULE);
    expect(overLimit).toContain(FUNCTION_RULE);
  });

  it('caps a component at 350 lines, because a component is a function', async () => {
    const component = (lines: number): string => {
      return `export const Page = () => {\n${codeLines(lines - 3, '  ')}  return <main />;\n};\n`;
    };

    const atLimit = await ruleIdsFor(base(), component(350), 'src/pages/page/Page.tsx');
    const overLimit = await ruleIdsFor(base(), component(351), 'src/pages/page/Page.tsx');

    expect(atLimit).not.toContain(FUNCTION_RULE);
    expect(overLimit).toContain(FUNCTION_RULE);
  });

  it('does not count a function\'s blank lines or comments', async () => {
    const padded = functionOf(350)
      .replace('{\n', '{\n\n  // a note\n\n');
    const ruleIds = await ruleIdsFor(base(), padded, TS_FILE);

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain(FUNCTION_RULE);
  });

  it.each([
    'src/app/format.test.ts',
    'src/app/format.spec.tsx',
    'src/app/format.e2e.test.ts',
    '__mocks__/handlers.ts',
    'src/__mocks__/fixtures/big.ts',
    'e2e/checkout.ts',
    'packages/create/e2e/runner/runner.ts',
  ])('holds neither limit on the test file %s', async (path) => {
    const code = `${codeLines(900)}${functionOf(400)}`;
    const ruleIds = await ruleIdsFor(base(), code, path);

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain(FILE_RULE);
    expect(ruleIds).not.toContain(FUNCTION_RULE);
  });
});
