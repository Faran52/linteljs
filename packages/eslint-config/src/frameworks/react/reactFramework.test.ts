import {
  ownBlockNames,
  ruleEntryFor,
  ruleIdsFor,
} from '@mocks/lintText';
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
    const config = [...base(), ...react()];
    const ruleIds = await ruleIdsFor(config, code, 'src/Logo.tsx');

    expect(ruleIds).toContain('jsx-a11y-x/alt-text');
  });

  it('reports an aria attribute that is not a real one', async () => {
    const code = 'export const Box = () => {\n  return <div aria-nonsense="x">a</div>;\n};\n';
    const config = [...base(), ...react()];
    const ruleIds = await ruleIdsFor(config, code, 'src/Box.tsx');

    expect(ruleIds).toContain('jsx-a11y-x/aria-props');
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(react());
    const expected = [
      '@linteljs/react/hooks-one-owner',
      '@linteljs/react/sonarjs',
      '@linteljs/react',
      '@linteljs/react/dom',
    ];
    expect(actual).toEqual(expected);
  });

  it.each([
    ['@eslint-react/dom-no-missing-button-type', '<button>x</button>'],
    ['@eslint-react/dom-no-missing-iframe-sandbox', '<iframe src="/a" title="a" />'],
    ['@eslint-react/dom-no-script-url', '<a href="javascript:void(0)">x</a>'],
    ['@eslint-react/dom-no-unsafe-target-blank', '<a href="https://a.example" target="_blank">x</a>'],
  ])('reports %s at error', async (ruleId, element) => {
    const code = `export const Chip = () => {\n  return ${element};\n};\n`;
    const config = [...base(), ...react()];
    const ruleIds = await ruleIdsFor(config, code, 'src/Chip.tsx');
    const entry = await ruleEntryFor(react(), 'src/Chip.tsx', ruleId);

    expect(ruleIds).toContain(ruleId);
    const expected = [2];
    expect(entry).toEqual(expected);
  });

  it.each([
    ['recommended', 'jsx-a11y-x/recommended'],
  ])('names %s when eslint-plugin-jsx-a11y-x stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('eslint-plugin-jsx-a11y-x', key, async () => {
      const reactFramework = await import('./reactFramework');
      return reactFramework.react;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
