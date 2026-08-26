import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { ruleIdsFor, ruleIdsForFile } from '@mocks/lintText';
import importX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import base from './base';

import type { Layer } from './types';

const TS_FILE = 'src/lib/utils/sample.ts';

describe('base: stylistic', () => {
  it('reports a line past 120 columns', async () => {
    const long = `export const value = '${'x'.repeat(130)}';`;

    await expect(ruleIdsFor(base(), long, TS_FILE)).resolves.toContain('@stylistic/max-len');
  });

  // Same class of thing `ignoreUrls` already exempts: one unbreakable token.
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

  // These come from `@stylistic/recommended`, not a rule `base` sets directly.
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

  // Both are scoped to object literals, so an import's braces stay the four `@linteljs` newline rules' business.
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

  it('reports a same-line else', async () => {
    const code = 'export const pick = (flag) => {\n  if (flag) {\n    return 1;\n  } else {\n    return 2;\n  }\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@stylistic/brace-style');
  });

  it('reports a braceless if', async () => {
    const code = 'export const pick = (flag) => {\n  if (flag) return 1;\n\n  return 2;\n};\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('curly');
  });
});

// `ignores` has to reach ESLint as a global ignore entry, not another `files` scope.
describe('base: ignores', () => {
  const doubleQuoted = 'export const value = "x";\n';
  /**
   * Not a `dist/` path: `base()` also ignores whatever this repository's own `.gitignore` covers, and that includes
   * `dist`, so a built path is no longer the "nothing covers this" case. `built` below is what the `ignores` option is
   * asked about, and it has to be a path git does not already ignore for the two assertions to be about the option.
   */
  const built = 'src/generated/bundle.js';

  it('lints a path no ignore covers', async () => {
    await expect(ruleIdsFor(base(), doubleQuoted, built)).resolves.toContain('@stylistic/quotes');
  });

  it('reports nothing under a path the ignore list covers', async () => {
    await expect(ruleIdsFor(base({ ignores: ['src/generated/**'] }), doubleQuoted, built))
      .resolves.not.toContain('@stylistic/quotes');
  });

  // The other half: what git ignores, ESLint ignores, without the project repeating it in `ignores`.
  it('reports nothing under a path only .gitignore covers', async () => {
    await expect(ruleIdsFor(base(), doubleQuoted, 'dist/bundle.js'))
      .resolves.not.toContain('@stylistic/quotes');
  });

  // A project need not have one, and a missing file is not an error: there is simply nothing to add.
  it('still builds a config where there is no .gitignore to read', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lintel-nogit-'));
    const spy = vi.spyOn(process, 'cwd').mockReturnValue(root);

    try {
      const gitignoreEntries = base().filter((entry) => {
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

  it('reports console.log but not console.warn', async () => {
    await expect(ruleIdsFor(base(), 'console.log(1);\n', TS_FILE)).resolves.toContain('no-console');
    await expect(ruleIdsFor(base(), 'console.warn(1);\n', TS_FILE)).resolves.not.toContain('no-console');
  });

  it('reports console.log in a .js file too', async () => {
    await expect(ruleIdsFor(base(), 'console.log(1);\n', 'src/tool.js')).resolves.toContain('no-console');
  });

  /**
   * The one place stdout is the product. Every reference repo had turned the rule off for a glob of its own, and each
   * reached for `**\/*.js`, which silences a genuine stray anywhere in plain-JS source. Granting the directory this
   * standard already puts scripts in is narrower than what a project writes when the standard declines to say.
   */
  /**
   * A hotspot rule has no clean state: it asks a human to confirm the execution is safe, and a fake of
   * `inspectedWindow.eval` that does not execute a source string is not a fake of it. Granted in the fixture
   * directory only, which is where this standard already puts fakes.
   */
  it('allows a fixture to execute a source string, and no source file to', async () => {
    const code = "import { runInThisContext } from 'node:vm';\n\nexport const run = (source: string): unknown => {\n"
      + '  return runInThisContext(source);\n};\n';

    await expect(ruleIdsFor(base(), code, '__mocks__/chromeFixture.ts'))
      .resolves.not.toContain('sonarjs/code-eval');
    await expect(ruleIdsFor(base(), code, 'src/runner.ts'))
      .resolves.toContain('sonarjs/code-eval');
  });

  // The grant is one rule wide. A fixture is still ordinary source for everything else base reports.
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

describe('base: lintel rules', () => {
  it('reports union-newline', async () => {
    const code = 'export type Value = { a: string } | { b: string };\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@linteljs/union-newline');
  });

  // The one rule the plugin publishes and holds out of `recommended`, so `base` is what enables it.
  it('reports interface-order', async () => {
    const code = 'export const value = 1;\n\nexport interface Shape {\n  a: string;\n}\n';

    await expect(ruleIdsFor(base(), code, TS_FILE)).resolves.toContain('@linteljs/interface-order');
  });
});

// Without `import-x/parsers` naming a `.cts`/`.mts` parser, `no-cycle` cannot parse the dependency and stays silent.
describe('base: import-x/no-cycle', () => {
  const entry = join(import.meta.dirname, '../__mocks__/fixtures/cycle/a.cts');

  it('reports a two-file cycle across .cts files', async () => {
    await expect(ruleIdsForFile(base(), entry)).resolves.toContain('import-x/no-cycle');
  });

  // Negative control: proves the test above isn't passing for an unrelated reason.
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
