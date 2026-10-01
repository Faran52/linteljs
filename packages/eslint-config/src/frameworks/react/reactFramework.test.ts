import { ownBlockNames, ruleIdsFor } from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';

import react from './reactFramework';

describe('react', () => {
  it('reports an image with no alt text', async () => {
    const code = 'export const Logo = () => {\n  return <img src="/a.png" />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...react()], code, 'src/Logo.tsx');

    expect(ruleIds).toContain('jsx-a11y-x/alt-text');
  });

  it('reports an aria attribute that is not a real one', async () => {
    const code = 'export const Box = () => {\n  return <div aria-nonsense="x">a</div>;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...react()], code, 'src/Box.tsx');

    expect(ruleIds).toContain('jsx-a11y-x/aria-props');
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(react())).toEqual([
      '@linteljs/react/hooks-one-owner',
      '@linteljs/react/sonarjs',
      '@linteljs/react',
    ]);
  });

  it.each([
    ['recommended', 'jsx-a11y-x/recommended'],
  ])('names %s when eslint-plugin-jsx-a11y-x stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-jsx-a11y-x', key, async () => {
      return (await import('./reactFramework')).react;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
