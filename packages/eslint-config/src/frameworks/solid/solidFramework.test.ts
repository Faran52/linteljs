import {
  ownBlockNames,
  ruleIdsFor,
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

import solid, { solidGroup } from './solidFramework';

describe('solid', () => {
  it('reports destructured props, which break reactivity in Solid', async () => {
    const code = 'export const Note = (props) => {\n  const { a } = props;\n\n  return <div>{a}</div>;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...solid()], code, 'src/pages/Note.tsx');

    expect(ruleIds.some(startsWith('solid/'))).toBe(true);
  });

  it('reports an image with no alt text', async () => {
    const code = 'export const Logo = () => {\n  return <img src="/a.png" />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...solid()], code, 'src/Logo.tsx');

    expect(ruleIds).toContain('jsx-a11y-x/alt-text');
  });

  it.each([
    ['@stylistic/jsx-self-closing-comp', '<div></div>'],
    ['@stylistic/jsx-pascal-case', '<My_Box />'],
  ])('reports %s', async (rule, element) => {
    const code = `export const Chip = () => {\n  return ${element};\n};\n`;
    const ruleIds = await ruleIdsFor([...base(), ...solid()], code, 'src/components/ui/Chip.tsx');

    expect(ruleIds).toContain(rule);
  });

  it('reports a JSX prop named twice on one element', async () => {
    const code = 'export const Chip = () => {\n  return <span class="a" class="b" />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...solid()], code, 'src/pages/Chip.tsx');

    expect(ruleIds).toContain('@linteljs/no-duplicate-jsx-props');
  });

  it('stays quiet when a spread sits between two same-named props', async () => {
    const code = 'export const Chip = (props) => {\n'
      + '  return <span class="a" {...props} class="b" />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...solid()], code, 'src/pages/Chip.tsx');

    expect(ruleIds).not.toContain('@linteljs/no-duplicate-jsx-props');
  });

  it('runs its linteljs rule without base', async () => {
    const code = 'export const Chip = () => {\n  return <span class="a" class="b" />;\n};\n';

    await expect(ruleIdsFor(solid(), code, 'src/pages/Chip.tsx'))
      .resolves.toContain('@linteljs/no-duplicate-jsx-props');
  });

  it.each([
    'solid-js',
    'solid-js/web',
    '@solidjs/router',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    await expect(sortsAheadOfPackages(base({ frameworkGroup: solidGroup }), specifier)).resolves.toBe(true);
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(solid())).toEqual([
      '@linteljs/solid',
    ]);
  });

  it.each([
    ['flat/typescript', 'solid/flat/typescript'],
  ])('names %s when eslint-plugin-solid stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-solid', key, async () => {
      return (await import('./solidFramework')).solid;
    });

    expect(layer).toThrow(`${label} is not published`);
  });

  it.each([
    ['recommended', 'jsx-a11y-x/recommended'],
  ])('names %s when eslint-plugin-jsx-a11y-x stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-jsx-a11y-x', key, async () => {
      return (await import('./solidFramework')).solid;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
