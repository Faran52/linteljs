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
  enabledRuleIdsFor,
  ownBlockNames,
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

import base from './baseLayer';

import type sonarjs from 'eslint-plugin-sonarjs';
import type { Layer } from '../../types';

interface FlatConfigsBearing {
  flatConfigs: object;
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

  it('reports two object properties sharing a line', async () => {
    const code = 'export const value = {\n  a: 1, b: 2,\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@stylistic/object-property-newline');
  });

  it('reports a brace left hanging on the first property', async () => {
    const code = 'export const value = { a: 1,\n  b: 2 };\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@stylistic/object-curly-newline');
  });

  it('leaves an import to the newline rules that own it', async () => {
    const code = "import { alpha, bravo } from 'mod';\n\nexport const value = alpha + bravo;\n";
    const reported = await ruleIdsFor(base(), code, TS_FILE);

    expect(reported).not.toContain('@stylistic/object-property-newline');
    expect(reported).not.toContain('@stylistic/object-curly-newline');
  });

  it('reports a single-quoted jsx attribute', async () => {
    const code = "export const Widget = () => {\n  return <div className='x' />;\n};\n";

    await expect(ruleIdsFor(base(), code, 'src/components/ui/Widget.tsx'))
      .resolves.toContain('@stylistic/jsx-quotes');
  });

  // The preset caps a multiline tag and nothing else, so the two-prop tag passing and the three-prop one failing is
  // the half that is new here. The multiline case is kept so a later edit cannot drop `multi` unnoticed.
  it('caps a single-line tag at two props and a multiline one at one per line', async () => {
    const widget = 'src/components/ui/Widget.tsx';
    const two = 'export const Widget = () => {\n  return <div id="a" lang="b" />;\n};\n';
    const three = 'export const Widget = () => {\n  return <div id="a" lang="b" title="c" />;\n};\n';
    const multiline = 'export const Widget = () => {\n  return (\n    <div\n      id="a" lang="b"\n    />\n  );\n};\n';

    await expect(ruleIdsFor(base(), two, widget)).resolves.not.toContain('@stylistic/jsx-max-props-per-line');
    await expect(ruleIdsFor(base(), three, widget)).resolves.toContain('@stylistic/jsx-max-props-per-line');
    await expect(ruleIdsFor(base(), multiline, widget)).resolves.toContain('@stylistic/jsx-max-props-per-line');
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

  it('reports a braceless if', async () => {
    const code = 'export const pick = (flag) => {\n  if (flag) return 1;\n\n  return 2;\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('curly');
  });
});

describe('base: ignores', () => {
  const doubleQuoted = 'export const value = "x";\n';
  // Not `dist/`: this repository's `.gitignore` already covers that, and the option is what is under test.
  const built = 'src/generated/bundle.js';

  it('lints a path no ignore covers', async () => {
    await expect(ruleIdsFor(base(), doubleQuoted, built)).resolves.toContain('@stylistic/quotes');
  });

  it('reports nothing under a path the ignore list covers', async () => {
    await expect(ruleIdsFor(base({ ignores: ['src/generated/**'] }), doubleQuoted, built))
      .resolves.not.toContain('@stylistic/quotes');
  });

  // Its own `.gitignore` in its own directory, not this repository's: `base()` reads `process.cwd()`, so a test
  // asserting against the workspace root only passes when vitest happens to be launched there.
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
    // A workspace keeps one `__mocks__/` per package, below the config's own root.
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
});

describe('base: unused imports', () => {
  it('reports the unused-imports rule and not the typescript-eslint one', async () => {
    const code = "import { join } from 'node:path';\n\nexport const value = 1;\n";
    const ruleIds = await ruleIdsFor(base(), code, TS_FILE);

    expect(ruleIds).toContain('unused-imports/no-unused-imports');
    expect(ruleIds).not.toContain('@typescript-eslint/no-unused-vars');
    expect(ruleIds).not.toContain('no-unused-vars');
  });
});

describe('base: restricted imports', () => {
  // The bare entry and a deep path: one gitignore-style pattern covers both.
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

  // The shape it asks for is one `@stylistic/indent` and the rest of the layer accept as it stands.
  it('reports nothing on a chain split one call per line', async () => {
    const code = 'export const names = (users: string[]): string[] => {\n  return users\n    .filter(Boolean)\n'
      + '    .map((user) => {\n      return user.trim();\n    });\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toEqual([]);
  });

  it('reports interface-order', async () => {
    const code = 'export const value = 1;\n\nexport interface Shape {\n  a: string;\n}\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@linteljs/interface-order');
  });

  // Derived from the plugin's own registry rather than named, so a new `language: 'typescript'` rule is covered the
  // day it is written instead of staying off in every `.vue` and `.svelte` script block.
  const TYPESCRIPT_RULE_IDS = Object.entries(lintelRules)
    .filter(([, rule]) => {
      return rule.meta.docs.language === 'typescript';
    })
    .map(([name]) => {
      return `@linteljs/${name}`;
    });

  it('has more than one TypeScript-only rule to restate, so the assertions below are not vacuous', () => {
    expect(TYPESCRIPT_RULE_IDS.length).toBeGreaterThan(1);
  });

  // Restated over the SFC extensions the plugin's own preset cannot reach, not over `.js`, where a rule enabled but
  // unable to fire is a claim about the config that is not true.
  it('leaves every TypeScript-only rule off a plain .js file', async () => {
    const names = await ruleNamesFor(base(), 'src/lib/utils/sample.js');

    for (const ruleId of TYPESCRIPT_RULE_IDS) {
      expect(`${ruleId}: ${String(names.includes(ruleId))}`).toBe(`${ruleId}: false`);
    }
  });

  it('keeps every one of them on for TypeScript and for an SFC, which is why they are restated at all', async () => {
    for (const file of ['src/lib/utils/sample.ts', 'src/components/Card.vue', 'src/components/Card.svelte']) {
      const enabled = await enabledRuleIdsFor(base(), file);

      for (const ruleId of TYPESCRIPT_RULE_IDS) {
        expect(`${file} ${ruleId}: ${String(enabled.includes(ruleId))}`).toBe(`${file} ${ruleId}: true`);
      }
    }
  });
});

// Without `import-x/parsers` naming a `.cts`/`.mts` parser, `no-cycle` stays silent.
describe('base: import-x/no-cycle', () => {
  const entry = join(import.meta.dirname, '../../../__mocks__/fixtures/cycle/a.cts');

  it('reports a two-file cycle across .cts files', async () => {
    await expect(ruleIdsForFile(base(), entry)).resolves.toContain('import-x/no-cycle');
  });

  // Negative control.
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

  // Opt-in, never a default; see baseLayer.ts for the measurement.
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

  // import-x keeps its flat presets under `flatConfigs`, and its settings are read off the same preset.
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

  // The plugin types `configs` as optional, so a release without it has to reach the same message.
  it('names the sonarjs preset when the plugin publishes no configs at all', async () => {
    const layer = await layerWithout('eslint-plugin-sonarjs', (plugin: typeof sonarjs) => {
      return {
        ...plugin,
        configs: undefined,
      };
    }, loadBase);

    expect(layer).toThrow('sonarjs/recommended is not published');
  });

  it('names the stylistic preset when the plugin stops publishing it', async () => {
    const layer = await layerWithoutConfig('@stylistic/eslint-plugin', 'recommended', loadBase);

    expect(layer).toThrow('stylistic/recommended is not published');
  });

  it('names the linteljs preset when the plugin stops publishing it', async () => {
    const layer = await layerWithoutConfig('@linteljs/eslint-plugin', 'flat/recommended', loadBase);

    expect(layer).toThrow('@linteljs/flat/recommended is not published');
  });
});
