import { join } from 'node:path';

import {
  codeLines,
  enabledRuleIdsFor,
  functionOf,
  messagesForFile,
  ownBlockNames,
  ruleIdsFor,
  ruleIdsForFile,
  ruleIdsForSfc,
  SFC_FIXTURES,
  sortsAheadOfPackages,
  startsWith,
} from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';

import svelte, { svelteGroup } from './svelteFramework';

const FILENAME_RULE = 'check-file/filename-naming-convention';

describe('svelte', () => {
  it('parses a component and reports on it', async () => {
    const config = [...base(), ...svelte()];
    const ruleIds = await ruleIdsForFile(config, join(SFC_FIXTURES, 'Page.svelte'));

    expect(ruleIds).not.toContain(null);
    const pluginReported = ruleIds.some(startsWith('svelte/'));
    expect(pluginReported).toBe(true);
  });

  it.each([
    ['src/routes/+page.ts', true],
    ['src/routes/+page.server.ts', true],
    ['src/routes/+server.ts', true],
    ['src/hooks.server.ts', false],
    ['src/service-worker.ts', true],
    ['src/params/integer.ts', false],
    ['src/app.ts', false],
  ])('holds check-file off %s only where the convention rejects it', async (path, reserved) => {
    const naming = { 'src/**/!(*.test|*.spec).ts': 'CAMEL_CASE' } as const;
    const code = 'export const value = 1;\n';

    const baseConfig = base({ naming });
    const unexempted = await ruleIdsFor(baseConfig, code, path);
    const svelteConfig = [...base({ naming }), ...svelte()];
    const exempted = await ruleIdsFor(svelteConfig, code, path);

    const included = unexempted.includes(FILENAME_RULE);
    expect(included).toBe(reserved);
    expect(exempted).not.toContain(FILENAME_RULE);
  });

  it.each([
    'src/routes/+page.svelte',
    'src/routes/+layout.js',
  ])('holds check-file off the route file %s', async (path) => {
    const naming = { 'src/**/*.{js,svelte}': 'CAMEL_CASE' } as const;

    const baseConfig = base({ naming });
    const baseEnabled = await enabledRuleIdsFor(baseConfig, path);
    expect(baseEnabled).toContain(FILENAME_RULE);
    const svelteConfig = [...base({ naming }), ...svelte()];
    const svelteEnabled = await enabledRuleIdsFor(svelteConfig, path);
    expect(svelteEnabled).not.toContain(FILENAME_RULE);
  });

  it.each([
    '$app/navigation',
    '$env/static/public',
  ])('lets %s go unresolved', async (specifier) => {
    const code = `import { a } from '${specifier}';\n\nexport const value = a;\n`;

    const baseRuleIds = await ruleIdsFor(base(), code, 'src/lib/sample.ts');
    expect(baseRuleIds).toContain('import-x/no-unresolved');

    const config = [...base(), ...svelte()];
    const svelteRuleIds = await ruleIdsFor(config, code, 'src/lib/sample.ts');
    expect(svelteRuleIds).not.toContain('import-x/no-unresolved');
  });

  it('still reports a package that does not resolve', async () => {
    const code = "import { a } from 'not-installed';\n\nexport const value = a;\n";

    const config = [...base(), ...svelte()];
    const ruleIds = await ruleIdsFor(config, code, 'src/lib/sample.ts');
    expect(ruleIds).toContain('import-x/no-unresolved');
  });

  it('parses a .svelte.ts rune module', async () => {
    const config = [...base(), ...svelte()];
    const messages = await messagesForFile(config, join(SFC_FIXTURES, 'counter.svelte.ts'));

    const fatal = messages
      .filter((message) => {
        return message.fatal === true;
      });

    expect(fatal).toEqual([]);
  });

  it.each([
    'svelte',
    'svelte/store',
    '@sveltejs/kit',
    '$app/navigation',
    '$env/static/public',
    '#lib/store/counterStore.ts',
    '#lib',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    const config = base({ frameworkGroup: svelteGroup });
    const actual = await sortsAheadOfPackages(config, specifier);
    expect(actual).toBe(true);
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(svelte());
    const expected = [
      '@linteljs/svelte/framework-specifiers',
      '@linteljs/svelte/route-filenames',
      '@linteljs/svelte',
    ];
    expect(actual).toEqual(expected);
  });

  it('caps a component file at 350 lines of code, markup and script together', async () => {
    const component = (lines: number): string => {
      return `<script>\n${codeLines(lines - 3)}</script>\n\n<main></main>\n`;
    };

    const config = [...base(), ...svelte()];
    const atLimit = await ruleIdsForSfc(config, component(350), 'Big.svelte');
    const overLimit = await ruleIdsForSfc(config, component(351), 'Big.svelte');

    expect(atLimit).not.toContain(null);
    expect(atLimit).not.toContain('max-lines');
    expect(overLimit).toContain('max-lines');
  });

  it('caps a function in a component script at 350 lines', async () => {
    const component = (lines: number): string => {
      return `<script>\n${functionOf(lines)}</script>\n`;
    };

    const config = [...base(), ...svelte()];
    const atLimit = await ruleIdsForSfc(config, component(350), 'Big.svelte');
    const overLimit = await ruleIdsForSfc(config, component(351), 'Big.svelte');

    expect(atLimit).not.toContain('max-lines-per-function');
    expect(overLimit).toContain('max-lines-per-function');
  });

  it.each([
    ['flat/recommended', 'svelte/flat/recommended'],
  ])('names %s when eslint-plugin-svelte stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-svelte', key, async () => {
      const svelteFramework = await import('./svelteFramework');
      return svelteFramework.svelte;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
