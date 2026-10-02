import {
  codeLines,
  enabledRuleIdsFor,
  functionOf,
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

const baseOptions = { astro: true } as const;
const WITH_BASE = [...base(baseOptions), ...astro()];

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

    const anyMatch = ruleIds.some(startsWith('astro/'));
    expect(anyMatch).toBe(true);
  });

  it('reports an image with no alt text in a template', async () => {
    const ruleIds = await ruleIdsFor(astro(), PAGE('<img src="/a.png" />'), 'src/pages/index.astro');

    expect(ruleIds).toContain('astro/jsx-a11y/alt-text');
  });

  it('lays out a template as JSX, which base leaves to the JSX frameworks', async () => {
    const ruleIds = await ruleIdsFor(WITH_BASE, PAGE("<p class='x'>a</p>"), 'src/pages/index.astro');

    expect(ruleIds).toContain('@stylistic/jsx-quotes');
  });

  it('enables no astro rule on a TypeScript file', async () => {
    const enabled = await enabledRuleIdsFor(WITH_BASE, 'src/lib/utils/sample.ts');

    const filtered = enabled.filter(startsWith('astro/'));
    expect(filtered).toEqual([]);
  });

  it('stacks under base without either losing its rules', async () => {
    const code = PAGE('<img src="/a.png" />');
    const ruleIds = await ruleIdsFor(WITH_BASE, code, 'src/pages/index.astro');

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

    const expected = [
      'astro/base/plugin',
      'astro/base',
      'astro/base/javascript',
      'astro/base/typescript',
    ];
    expect(astroBase).toEqual(expected);
  });

  it.each([
    'src/pages/index.astro/0_0.ts',
    'src/pages/index.astro/1_1.js',
  ])('leaves the virtual script %s untyped under typescript()', async (path) => {
    const config = [
      ...base(),
      ...typescript(),
      ...astro(),
    ];
    const names = await ruleNamesFor(config, path);
    const enabledRuleIdsForConfig = [
      ...base(),
      ...typescript(),
      ...astro(),
    ];
    const enabled = await enabledRuleIdsFor(enabledRuleIdsForConfig, path);

    expect(names).toContain('@typescript-eslint/no-floating-promises');
    expect(enabled).not.toContain('@typescript-eslint/no-floating-promises');
  });

  it('names the TypeScript parser for a template and its virtual scripts', () => {
    const typed = astro()
      .filter(({ name }) => {
        return name?.startsWith('@linteljs/astro/typescript');
      });

    const expected = [
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
    ];
    expect(typed).toEqual(expected);
  });

  it('leaves inline text beside an element on its line, where a break would render as a space', async () => {
    const page = '---\n---\n\n<p><code>x</code>, which</p>\n';
    const ruleIds = await ruleIdsFor(WITH_BASE, page, 'src/pages/index.astro');

    expect(ruleIds).not.toContain('@stylistic/jsx-one-expression-per-line');
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(astro());
    const expected = [
      '@linteljs/astro/typescript',
      '@linteljs/astro/jsx-layout',
      '@linteljs/astro/text-whitespace',
      '@linteljs/astro/typescript-scripts',
      '@linteljs/astro/untyped',
    ];
    expect(actual).toEqual(expected);
  });

  it('caps a component file at 350 lines of code, frontmatter and template together', async () => {
    const component = (lines: number): string => {
      return `---\n${codeLines(lines - 3)}---\n\n<main></main>\n`;
    };

    const atLimit = await ruleIdsFor(WITH_BASE, component(350), 'src/components/Big.astro');
    const overLimit = await ruleIdsFor(WITH_BASE, component(351), 'src/components/Big.astro');

    expect(atLimit).not.toContain(null);
    expect(atLimit).not.toContain('max-lines');
    expect(overLimit).toContain('max-lines');
  });

  it('caps a function in the frontmatter at 350 lines', async () => {
    const component = (lines: number): string => {
      return `---\n${functionOf(lines)}---\n`;
    };

    const atLimit = await ruleIdsFor(WITH_BASE, component(350), 'src/components/Big.astro');
    const overLimit = await ruleIdsFor(WITH_BASE, component(351), 'src/components/Big.astro');

    expect(atLimit).not.toContain('max-lines-per-function');
    expect(overLimit).toContain('max-lines-per-function');
  });

  it('counts no IIFE in the frontmatter as a function', async () => {
    const code = `---\n(() => {\n${codeLines(351, '  ')}})();\n---\n`;
    const ruleIds = await ruleIdsFor(WITH_BASE, code, 'src/components/Big.astro');

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain('max-lines-per-function');
  });

  it('counts neither blank lines nor comments in a component file', async () => {
    const padded = `---\n${codeLines(347)}\n// a note\n\n---\n\n<main></main>\n`;
    const ruleIds = await ruleIdsFor(WITH_BASE, padded, 'src/components/Big.astro');

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain('max-lines');
  });

  it('counts neither blank lines nor comments in a frontmatter function', async () => {
    const padded = `---\n${functionOf(350).replace('{\n', '{\n\n  // a note\n\n')}---\n`;
    const ruleIds = await ruleIdsFor(WITH_BASE, padded, 'src/components/Big.astro');

    expect(ruleIds).not.toContain(null);
    expect(ruleIds).not.toContain('max-lines-per-function');
  });

  it.each([
    ['flat/recommended', 'astro/flat/recommended'],
    ['flat/jsx-a11y-recommended', 'astro/flat/jsx-a11y-recommended'],
  ])('names %s when the plugin stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-astro', key, async () => {
      const astroFramework = await import('./astroFramework');
      return astroFramework.astro;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
