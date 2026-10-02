import {
  LEAKED_RENDER_FIXTURE,
  ownBlockNames,
  ruleEntryFor,
  ruleIdsFor,
  ruleIdsForFile,
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
import typescript from '../../layers/typescript/typescriptLayer';

import solid, { solidGroup } from './solidFramework';

describe('solid', () => {
  it('reports destructured props, which break reactivity in Solid', async () => {
    const code = 'export const Note = (props) => {\n  const { a } = props;\n\n  return <div>{a}</div>;\n};\n';
    const config = [...base(), ...solid()];
    const ruleIds = await ruleIdsFor(config, code, 'src/pages/Note.tsx');

    const pluginReported = ruleIds.some(startsWith('solid/'));
    expect(pluginReported).toBe(true);
  });

  it('reports an image with no alt text', async () => {
    const code = 'export const Logo = () => {\n  return <img src="/a.png" />;\n};\n';
    const config = [...base(), ...solid()];
    const ruleIds = await ruleIdsFor(config, code, 'src/Logo.tsx');

    expect(ruleIds).toContain('jsx-a11y-x/alt-text');
  });

  it.each([
    ['@stylistic/jsx-self-closing-comp', '<div></div>'],
    ['@stylistic/jsx-pascal-case', '<My_Box />'],
    ['@stylistic/jsx-quotes', "<div class='x' />"],
  ])('reports %s', async (rule, element) => {
    const code = `export const Chip = () => {\n  return ${element};\n};\n`;
    const config = [...base(), ...solid()];
    const ruleIds = await ruleIdsFor(config, code, 'src/components/ui/Chip.tsx');

    expect(ruleIds).toContain(rule);
  });

  it('reports a JSX prop named twice on one element', async () => {
    const code = 'export const Chip = () => {\n  return <span class="a" class="b" />;\n};\n';
    const config = [...base(), ...solid()];
    const ruleIds = await ruleIdsFor(config, code, 'src/pages/Chip.tsx');

    expect(ruleIds).toContain('@linteljs/no-duplicate-jsx-props');
  });

  it('stays quiet when a spread sits between two same-named props', async () => {
    const code = 'export const Chip = (props) => {\n'
      + '  return <span class="a" {...props} class="b" />;\n};\n';
    const config = [...base(), ...solid()];
    const ruleIds = await ruleIdsFor(config, code, 'src/pages/Chip.tsx');

    expect(ruleIds).not.toContain('@linteljs/no-duplicate-jsx-props');
  });

  it('reports a number rendered through &&, which shows a 0', async () => {
    const config = [
      ...base(),
      ...typescript(),
      ...solid(),
    ];
    const ruleIds = await ruleIdsForFile(config, LEAKED_RENDER_FIXTURE);
    const entry = await ruleEntryFor(solid(), 'src/Count.tsx', 'sonarjs/jsx-no-leaked-render');

    expect(ruleIds).toContain('sonarjs/jsx-no-leaked-render');
    const expected = [2];
    expect(entry).toEqual(expected);
  });

  it('leaves the leaked render to the framework, so base alone stays quiet', async () => {
    const config = [...base(), ...typescript()];
    const ruleIds = await ruleIdsForFile(config, LEAKED_RENDER_FIXTURE);

    expect(ruleIds).not.toContain('sonarjs/jsx-no-leaked-render');
  });

  it('runs its linteljs rule without base', async () => {
    const code = 'export const Chip = () => {\n  return <span class="a" class="b" />;\n};\n';

    const ruleIds = await ruleIdsFor(solid(), code, 'src/pages/Chip.tsx');
    expect(ruleIds).toContain('@linteljs/no-duplicate-jsx-props');
  });

  it.each([
    'solid-js',
    'solid-js/web',
    '@solidjs/router',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    const config = base({ frameworkGroup: solidGroup });
    const actual = await sortsAheadOfPackages(config, specifier);
    expect(actual).toBe(true);
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(solid());
    const expected = [
      '@linteljs/solid/sonarjs',
      '@linteljs/solid',
    ];
    expect(actual).toEqual(expected);
  });

  it.each([
    ['flat/typescript', 'solid/flat/typescript'],
  ])('names %s when eslint-plugin-solid stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-solid', key, async () => {
      const solidFramework = await import('./solidFramework');
      return solidFramework.solid;
    });

    expect(layer).toThrow(`${label} is not published`);
  });

  it.each([
    ['recommended', 'jsx-a11y-x/recommended'],
  ])('names %s when eslint-plugin-jsx-a11y-x stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-jsx-a11y-x', key, async () => {
      const solidFramework = await import('./solidFramework');
      return solidFramework.solid;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
