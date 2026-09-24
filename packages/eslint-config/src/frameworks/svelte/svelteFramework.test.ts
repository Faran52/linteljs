import { join } from 'node:path';

import {
  enabledRuleIdsFor,
  messagesForFile,
  ownBlockNames,
  ruleIdsFor,
  ruleIdsForFile,
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
  // With `base()`, which registers the `import-x` plugin the layer configures.
  it('parses a component and reports on it', async () => {
    const ruleIds = await ruleIdsForFile([...base(), ...svelte()], join(SFC_FIXTURES, 'Page.svelte'));

    expect(ruleIds).not.toContain(null);
    expect(ruleIds.some(startsWith('svelte/'))).toBe(true);
  });

  // `.svelte` route files are absent: `projectService` throws on a path with no file; the e2e suite covers them.
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

    const unexempted = await ruleIdsFor(base({ naming }), code, path);
    const exempted = await ruleIdsFor([...base({ naming }), ...svelte()], code, path);

    expect(unexempted.includes(FILENAME_RULE)).toBe(reserved);
    expect(exempted).not.toContain(FILENAME_RULE);
  });

  it.each([
    'src/routes/+page.svelte',
    'src/routes/+layout.js',
  ])('holds check-file off the route file %s', async (path) => {
    const naming = { 'src/**/*.{js,svelte}': 'CAMEL_CASE' } as const;

    await expect(enabledRuleIdsFor(base({ naming }), path)).resolves.toContain(FILENAME_RULE);
    await expect(enabledRuleIdsFor([...base({ naming }), ...svelte()], path)).resolves.not.toContain(FILENAME_RULE);
  });

  // `$lib` may not exist before `svelte-kit sync`, and `$app`/`$env` never exist on disk at all.
  it.each([
    '$lib/utils',
    '$app/navigation',
    '$env/static/public',
  ])('lets %s go unresolved', async (specifier) => {
    const code = `import { a } from '${specifier}';\n\nexport const value = a;\n`;

    await expect(ruleIdsFor(base(), code, 'src/lib/sample.ts')).resolves.toContain('import-x/no-unresolved');
    await expect(ruleIdsFor([...base(), ...svelte()], code, 'src/lib/sample.ts'))
      .resolves.not.toContain('import-x/no-unresolved');
  });

  // The allowance is those three prefixes and no wider: a package that is not installed is still reported.
  it('still reports a package that does not resolve', async () => {
    const code = "import { a } from 'not-installed';\n\nexport const value = a;\n";

    await expect(ruleIdsFor([...base(), ...svelte()], code, 'src/lib/sample.ts'))
      .resolves.toContain('import-x/no-unresolved');
  });

  // A rune module is TypeScript inside the Svelte parser, which needs typescript-eslint beneath it to read a type.
  it('parses a .svelte.ts rune module', async () => {
    const messages = await messagesForFile([...base(), ...svelte()], join(SFC_FIXTURES, 'counter.svelte.ts'));

    expect(messages.filter((message) => {
      return message.fatal === true;
    })).toEqual([]);
  });

  it.each([
    'svelte',
    'svelte/store',
    '@sveltejs/kit',
    '$app/navigation',
    '$env/static/public',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    await expect(sortsAheadOfPackages(base({ frameworkGroup: svelteGroup }), specifier)).resolves.toBe(true);
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(svelte())).toEqual([
      '@linteljs/svelte/framework-specifiers',
      '@linteljs/svelte/route-filenames',
      '@linteljs/svelte',
    ]);
  });

  it.each([
    ['flat/recommended', 'svelte/flat/recommended'],
  ])('names %s when eslint-plugin-svelte stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-svelte', key, async () => {
      return (await import('./svelteFramework')).svelte;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
