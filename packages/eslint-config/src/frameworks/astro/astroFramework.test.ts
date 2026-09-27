import {
  enabledRuleIdsFor,
  ownBlockNames,
  ruleIdsFor,
  ruleNamesFor,
  startsWith,
} from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import tseslint from 'typescript-eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';
import typescript from '../../layers/typescript/typescriptLayer';

import astro from './astroFramework';

const PAGE = (body: string): string => {
  return `---\nconst title = 'Home';\n---\n\n<h1>{title}</h1>\n${body}\n`;
};

describe('astro', () => {
  it('parses a template and reports an astro rule', async () => {
    const ruleIds = await ruleIdsFor(
      astro(),
      PAGE('<div set:html={title} set:text={title} />'),
      'src/pages/index.astro',
    );

    expect(ruleIds.some(startsWith('astro/'))).toBe(true);
  });

  it('reports an image with no alt text in a template', async () => {
    const ruleIds = await ruleIdsFor(astro(), PAGE('<img src="/a.png" />'), 'src/pages/index.astro');

    expect(ruleIds).toContain('astro/jsx-a11y/alt-text');
  });

  it('enables no astro rule on a TypeScript file', async () => {
    const enabled = await enabledRuleIdsFor([...base(), ...astro()], 'src/lib/utils/sample.ts');

    expect(enabled.filter(startsWith('astro/'))).toEqual([]);
  });

  it('stacks under base without either losing its rules', async () => {
    const code = PAGE('<img src="/a.png" />');
    const ruleIds = await ruleIdsFor([...base(), ...astro()], code, 'src/pages/index.astro');

    expect(ruleIds).toContain('astro/jsx-a11y/alt-text');
  });

  it('carries each base entry of the plugin once', () => {
    const names = astro()
      .flatMap(({ name }) => {
        return name === undefined ? [] : [name];
      });

    const astroBase = names
      .filter((name) => {
        return name.startsWith('astro/base');
      });

    expect(astroBase).toEqual(['astro/base/plugin', 'astro/base', 'astro/base/javascript', 'astro/base/typescript']);
  });

  it.each([
    'src/pages/index.astro/0_0.ts',
    'src/pages/index.astro/1_1.js',
  ])('leaves the virtual script %s untyped under typescript()', async (path) => {
    const names = await ruleNamesFor([...base(), ...typescript(), ...astro()], path);
    const enabled = await enabledRuleIdsFor([...base(), ...typescript(), ...astro()], path);

    expect(names).toContain('@typescript-eslint/no-floating-promises');
    expect(enabled).not.toContain('@typescript-eslint/no-floating-promises');
  });

  it('names the TypeScript parser for a template and its virtual scripts', () => {
    const typed = astro()
      .filter(({ name }) => {
        return name?.startsWith('@linteljs/astro/typescript');
      });

    expect(typed).toEqual([
      {
        name: '@linteljs/astro/typescript',
        files: ['**/*.astro'],
        languageOptions: { parserOptions: { parser: tseslint.parser } },
        processor: 'astro/client-side-ts',
      },
      {
        name: '@linteljs/astro/typescript-scripts',
        files: ['**/*.astro/*.ts'],
        languageOptions: { parser: tseslint.parser },
      },
    ]);
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(astro())).toEqual([
      '@linteljs/astro/typescript',
      '@linteljs/astro/typescript-scripts',
      '@linteljs/astro/untyped',
    ]);
  });

  it.each([
    ['flat/recommended', 'astro/flat/recommended'],
    ['flat/jsx-a11y-recommended', 'astro/flat/jsx-a11y-recommended'],
  ])('names %s when the plugin stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-astro', key, async () => {
      return (await import('./astroFramework')).astro;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
