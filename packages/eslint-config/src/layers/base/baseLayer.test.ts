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

    await expect(ruleIdsFor(base(), long, TS_FILE)).resolves.toContain('@stylistic/max-len');
  });

  it('exempts a line that is only a long attribute value', async () => {
    const path = `  d="${'M10 3.22l-.61-.6a5.5 5.5 0 0 0-7.666.105 '.repeat(30)}"`;

    await expect(ruleIdsFor(base(), `const svg = \`\n${path}\n\`;\n`, TS_FILE))
      .resolves.not.toContain('@stylistic/max-len');
  });

  it('still reports real code that happens to sit beside one', async () => {
    const long = `export const d = "x" + '${'y'.repeat(130)}';`;

    await expect(ruleIdsFor(base(), long, TS_FILE)).resolves.toContain('@stylistic/max-len');
  });

  it('reports a double-quoted string', async () => {
    await expect(ruleIdsFor(base(), 'export const value = "x";\n', TS_FILE))
      .resolves.toContain('@stylistic/quotes');
  });

  it('reports a missing trailing comma in a multiline literal', async () => {
    const code = 'export const value = {\n  a: 1,\n  b: 2\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@stylistic/comma-dangle');
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

  it('reports a half-split pair of object properties', async () => {
    const code = 'export const value = { a: 1,\n  b: 2 };\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@linteljs/member-newline');
  });

  it('reports a brace left hanging on a single property', async () => {
    const code = 'export const value = { a: 1\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@stylistic/object-curly-newline');
  });

  it('leaves an import to the newline rules that own it', async () => {
    const code = "import { alpha, bravo } from 'mod';\n\nexport const value = alpha + bravo;\n";
    const reported = await ruleIdsFor(base(), code, TS_FILE);

    expect(reported).not.toContain('@stylistic/object-property-newline');
    expect(reported).not.toContain('@stylistic/object-curly-newline');
  });

  it('reports a same-line else', async () => {
    const code = 'export const pick = (flag) => {\n  if (flag) {\n    return 1;\n  } else {\n    return 2;\n  }\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@stylistic/brace-style');
  });

  it('reports a block kept on one line, which the preset allows', async () => {
    const code = 'export const pick = (flag) => {\n  if (flag) { return 1; }\n\n  return 2;\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@stylistic/brace-style');
  });

  it('exempts a line whose length is a URL', async () => {
    const code = `// https://example.com/${'a'.repeat(130)}\nexport const value = 1;\n`;

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.not.toContain('@stylistic/max-len');
  });

  it('lets a string take the other quote rather than escape one', async () => {
    await expect(ruleIdsFor(base(), 'export const value = "it\'s";\n', TS_FILE))
      .resolves.not.toContain('@stylistic/quotes');
  });

  it('lets one property sit between braces on their own lines', async () => {
    await expect(ruleIdsFor(base(), 'export const value = {\n  a: 1,\n};\n', TS_FILE))
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

    await expect(ruleIdsFor(base(), comma, TS_FILE)).resolves.toContain('@stylistic/member-delimiter-style');
    await expect(ruleIdsFor(base(), bareLast, TS_FILE)).resolves.toContain('@stylistic/member-delimiter-style');
    await expect(ruleIdsFor(base(), closed, TS_FILE)).resolves.not.toContain('@stylistic/member-delimiter-style');
  });

  it('separates a one-line type with semicolons and leaves its last member bare', async () => {
    const comma = 'export const value = (shape: { a: string, b: string }) => shape;\n';
    const bareLast = 'export const value = (shape: { a: string; b: string }) => shape;\n';

    await expect(ruleIdsFor(base(), comma, TS_FILE)).resolves.toContain('@stylistic/member-delimiter-style');
    await expect(ruleIdsFor(base(), bareLast, TS_FILE)).resolves.not.toContain('@stylistic/member-delimiter-style');
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
  ])('reports %s', async (rule, code, file) => {
    const ids = await ruleIdsFor(base(), code, file);

    expect(ids).toContain(rule);
  });

  it('leaves a barrel of re-exports packed, since a blank line between them never settles', async () => {
    const code = "export { a } from './a';\nexport { b } from './b';\n";
    const ids = await ruleIdsFor(base(), code, 'src/lib/index.ts');

    expect(ids).not.toContain('@stylistic/padding-line-between-statements');
  });

  it('reports a braceless if', async () => {
    const code = 'export const pick = (flag) => {\n  if (flag) return 1;\n\n  return 2;\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('curly');
  });
});

describe('base: ignores', () => {
  const doubleQuoted = 'export const value = "x";\n';
  const built = 'src/generated/bundle.js';

  it('lints a path no ignore covers', async () => {
    await expect(ruleIdsFor(base(), doubleQuoted, built)).resolves.toContain('@stylistic/quotes');
  });

  it('reports nothing under a path the ignore list covers', async () => {
    await expect(ruleIdsFor(base({ ignores: ['src/generated/**'] }), doubleQuoted, built))
      .resolves.not.toContain('@stylistic/quotes');
  });

  it('reports nothing under a path only .gitignore covers', async () => {
    const root = await realpath(await mkdtemp(join(tmpdir(), 'linteljs-gitignore-')));

    await writeFile(join(root, '.gitignore'), 'dist\n');

    const spy = vi.spyOn(process, 'cwd').mockReturnValue(root);

    try {
      await expect(ruleIdsFor(base(), doubleQuoted, join(root, 'dist/bundle.js')))
        .resolves.not.toContain('@stylistic/quotes');
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
    const root = await realpath(await mkdtemp(join(tmpdir(), 'linteljs-names-')));

    await writeFile(join(root, '.gitignore'), 'dist\n');

    const spy = vi.spyOn(process, 'cwd').mockReturnValue(root);

    try {
      const names = ownBlockNames(base({
        ignores: ['build/**'],
        naming: { 'src/**/*.ts': 'CAMEL_CASE' },
      }));

      const baseBlocks = names
        .filter((name) => {
          return name.startsWith('@linteljs/base');
        });

      expect(baseBlocks).toEqual([
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
        '@linteljs/base/naming',
      ]);
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
    const root = await mkdtemp(join(tmpdir(), 'linteljs-nogit-'));
    const spy = vi.spyOn(process, 'cwd').mockReturnValue(root);

    try {
      const gitignoreEntries = base()
        .filter((entry) => {
          return entry.name === '@linteljs/base/gitignore';
        });

      expect(gitignoreEntries).toEqual([]);
      await expect(ruleIdsFor(base(), doubleQuoted, built)).resolves.toContain('@stylistic/quotes');
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
    await expect(ruleIdsFor(base(), 'export function foo() {\n  return 1;\n}\n', TS_FILE))
      .resolves.toContain('func-style');
  });

  it('reports console.log but not console.warn or console.error', async () => {
    await expect(ruleIdsFor(base(), 'console.log(1);\n', TS_FILE)).resolves.toContain('no-console');
    await expect(ruleIdsFor(base(), 'console.warn(1);\n', TS_FILE)).resolves.not.toContain('no-console');
    await expect(ruleIdsFor(base(), 'console.error(1);\n', TS_FILE)).resolves.not.toContain('no-console');
  });

  it('reports console.log in a .js file too', async () => {
    await expect(ruleIdsFor(base(), 'console.log(1);\n', 'src/tool.js')).resolves.toContain('no-console');
  });

  it('allows a fixture to execute a source string, and no source file to', async () => {
    const code = "import { runInThisContext } from 'node:vm';\n\nexport const run = (source: string): unknown => {\n"
      + '  return runInThisContext(source);\n};\n';

    await expect(ruleIdsFor(base(), code, '__mocks__/chromeFixture.ts'))
      .resolves.not.toContain('sonarjs/code-eval');

    await expect(ruleIdsFor(base(), code, 'packages/app/__mocks__/chromeFixture.ts'))
      .resolves.not.toContain('sonarjs/code-eval');

    await expect(ruleIdsFor(base(), code, 'src/runner.ts'))
      .resolves.toContain('sonarjs/code-eval');
  });

  it('grants a fixture nothing beyond that one rule', async () => {
    await expect(ruleIdsFor(base(), 'console.log(1);\n', '__mocks__/chromeFixture.ts'))
      .resolves.toContain('no-console');
  });

  it('allows console in a build script, and nowhere near it', async () => {
    await expect(ruleIdsFor(base(), 'console.log(1);\n', 'scripts/generateIcons.js'))
      .resolves.not.toContain('no-console');

    await expect(ruleIdsFor(base(), 'console.log(1);\n', 'scripts/nested/build.ts'))
      .resolves.not.toContain('no-console');

    await expect(ruleIdsFor(base(), 'console.log(1);\n', 'src/scripts/tool.ts'))
      .resolves.toContain('no-console');
  });

  it('prefers destructuring in an object declaration only', async () => {
    const code = [
      'const source = { width: 1, height: 2 };',
      'const pair = [1, 2];',
      'export const width = source.width;',
      'export const tall = source.height;',
      'export const first = pair[0];',
      'export let late = 0;',
      'late = source.width;',
      '',
    ].join('\n');
    const reported = (await ruleIdsFor(base(), code, 'src/tool.js'))
      .filter((ruleId) => {
        return ruleId === 'prefer-destructuring';
      });

    expect(reported).toHaveLength(1);
  });

  it('restates every prefer-destructuring option, and leaves the TypeScript twin to the typed layer', async () => {
    const entry = await ruleEntryFor(base(), TS_FILE, 'prefer-destructuring');
    const ruleNames = await ruleNamesFor(base(), TS_FILE);

    expect(entry).toEqual([
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
    ]);

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

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('import-x/no-duplicates');
  });
});

describe('base: restricted imports', () => {
  it('reports the compat entry and its subpaths, and leaves the core entry alone', async () => {
    const importing = (from: string): string => {
      return `import { sortBy } from '${from}';\n\nexport const run = sortBy;\n`;
    };

    await expect(ruleIdsFor(base(), importing('es-toolkit/compat'), TS_FILE))
      .resolves.toContain('no-restricted-imports');

    await expect(ruleIdsFor(base(), importing('es-toolkit/compat/array/sortBy'), TS_FILE))
      .resolves.toContain('no-restricted-imports');

    await expect(ruleIdsFor(base(), importing('es-toolkit'), TS_FILE))
      .resolves.not.toContain('no-restricted-imports');
  });
});

describe('base: linteljs rules', () => {
  it('reports union-newline', async () => {
    const code = 'export type Value = { a: string } | { b: string };\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@linteljs/union-newline');
  });

  it('reports chain-call-newline', async () => {
    const code = 'export const names = (users: string[]): string[] => users.filter(Boolean).map(String);\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@linteljs/chain-call-newline');
  });

  it('reports nothing on a chain split one call per line', async () => {
    const code = 'export const names = (users: string[]): string[] => {\n  return users\n    .filter(Boolean)\n'
      + '    .map((user) => {\n      return user.trim();\n    });\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toEqual([]);
  });

  it('reports interface-order', async () => {
    const code = 'export const value = 1;\n\nexport interface Shape {\n  a: string;\n}\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@linteljs/interface-order');
  });

  it('reports a second interface of one name in a scope, and not a global augmentation', async () => {
    const code = 'export interface Shape {\n  a: string;\n}\n\nexport interface Shape {\n  b: string;\n}\n\n'
      + 'declare global {\n  interface Shape {\n    c: string;\n  }\n}\n';
    const reported = (await ruleIdsFor(base(), code, TS_FILE))
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
      expect(`${ruleId}: ${String(names.includes(ruleId))}`).toBe(`${ruleId}: false`);
    }
  });

  it('keeps every one of them on for TypeScript and for an SFC, which is why they are restated at all', async () => {
    for (const file of [
      'src/lib/utils/sample.ts',
      'src/components/Card.vue',
      'src/components/Card.svelte',
    ]) {
      const enabled = await enabledRuleIdsFor(base(), file);

      for (const ruleId of TYPESCRIPT_RULE_IDS) {
        expect(`${file} ${ruleId}: ${String(enabled.includes(ruleId))}`).toBe(`${file} ${ruleId}: true`);
      }
    }
  });
});

describe('base: astro', () => {
  it('gives a .astro file every rule a TypeScript file gets, on request', async () => {
    const script = await enabledRuleIdsFor(base(), 'src/lib/utils/sample.ts');
    const component = await enabledRuleIdsFor(base({ astro: true }), 'src/pages/index.astro');
    const unordered = new Set(component);

    expect(unordered).toEqual(new Set(script));
  });

  it('lints the frontmatter of a .astro file only on request', async () => {
    const page = '---\nfunction title() {\n  return 1;\n}\n---\n\n<h1>{title()}</h1>\n';
    const requested = await ruleIdsFor([...base({ astro: true }), ...astro()], page, 'src/pages/index.astro');
    const unrequested = await ruleIdsFor([...base(), ...astro()], page, 'src/pages/index.astro');

    expect(requested).toContain('func-style');
    expect(unrequested).not.toContain('func-style');
  });
});

describe('base: import-x/no-cycle', () => {
  const entry = join(import.meta.dirname, '../../../__mocks__/fixtures/cycle/a.cts');

  it('reports a two-file cycle across .cts files', async () => {
    await expect(ruleIdsForFile(base(), entry)).resolves.toContain('import-x/no-cycle');
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

    await expect(ruleIdsForFile(handWritten, entry)).resolves.toEqual([]);
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

    expect(settings?.['import-x/resolver']).toEqual({ typescript: RESOLVER_DEFAULTS });
    expect(settings).toHaveProperty('import-x/parsers');
    expect(settings).toHaveProperty('import-x/extensions');
    expect(settings).toHaveProperty('import-x/external-module-folders');
  });

  it('points the resolver at a named tsconfig when one is supplied, keeping the defaults', () => {
    const settings = settingsOf(base({ resolver: { project: 'packages/*/tsconfig.json' } }));

    expect(settings?.['import-x/resolver']).toEqual({
      typescript: {
        ...RESOLVER_DEFAULTS,
        project: 'packages/*/tsconfig.json',
      },
    });

    expect(settings).toHaveProperty('import-x/parsers');
  });

  it('passes through the conditions a project asks for', () => {
    const conditionNames = ['import', 'types'];
    const settings = settingsOf(base({ resolver: { conditionNames } }));

    expect(settings?.['import-x/resolver']).toEqual({
      typescript: {
        ...RESOLVER_DEFAULTS,
        conditionNames,
      },
    });
  });

  it('passes noWarnOnMultipleProjects through only when asked', () => {
    const settings = settingsOf(base({
      resolver: {
        project: 'packages/*/tsconfig.json',
        noWarnOnMultipleProjects: true,
      },
    }));

    expect(settings).toMatchObject({
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: 'packages/*/tsconfig.json',
          noWarnOnMultipleProjects: true,
        },
      },
    });

    expect(settingsOf(base())).toMatchObject({ 'import-x/resolver': { typescript: { alwaysTryTypes: true } } });
  });
});

describe('base: presets', () => {
  const loadBase = async (): Promise<() => Layer> => {
    return (await import('./baseLayer')).base;
  };

  it('names the import-x preset when the plugin stops publishing it', async () => {
    const layer = await layerWithout('eslint-plugin-import-x', (plugin: FlatConfigsBearing) => {
      return {
        ...plugin,
        flatConfigs: {
          ...plugin.flatConfigs,
          typescript: undefined,
        },
      };
    }, loadBase);

    expect(layer).toThrow('import-x/typescript is not published');
  });

  it('names the sonarjs preset when the plugin publishes no configs at all', async () => {
    const layer = await layerWithout('eslint-plugin-sonarjs', (plugin: typeof sonarjs) => {
      return {
        ...plugin,
        configs: undefined,
      };
    }, loadBase);

    expect(layer).toThrow('sonarjs/recommended is not published');
  });

  it('names the stylistic preset when the plugin stops building it', async () => {
    const layer = await layerWithout('@stylistic/eslint-plugin', (plugin: ConfigsBearing) => {
      return {
        ...plugin,
        configs: {
          ...plugin.configs,
          customize: () => {
            return undefined;
          },
        },
      };
    }, loadBase);

    expect(layer).toThrow('stylistic/customize is not published');
  });

  it('names the linteljs preset when the plugin stops publishing it', async () => {
    const layer = await layerWithoutConfig('@linteljs/eslint-plugin', 'flat/recommended', loadBase);

    expect(layer).toThrow('@linteljs/flat/recommended is not published');
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
    'packages/create/src/pipeline/e2e/runner/runner.ts',
  ])('holds neither limit on the test file %s', async (path) => {
    const code = `${codeLines(900)}${functionOf(400)}`;
    const ruleIds = await ruleIdsFor(base(), code, path);

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain(FILE_RULE);
    expect(ruleIds).not.toContain(FUNCTION_RULE);
  });
});
