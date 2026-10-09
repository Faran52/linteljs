import {
  frameworkRuleIdsFor,
  ruleIdsFor,
} from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base/baseLayer';

import storybook from './storybookLayer';

import type { Layer } from '../../types';

const NO_DEFAULT = 'export const Primary = {};\n';

const CLEAN = "export default { title: 'Button' };\n\nexport const Primary = {};\n";

const STORY_PATH = 'src/components/button/Button.stories.ts';

describe('storybook', () => {
  const layer = (): Layer => {
    const built = [...base(), ...storybook()];

    return built;
  };

  it('reports a story file with no default export', async () => {
    const ruleIds = await ruleIdsFor(layer(), NO_DEFAULT, STORY_PATH);
    expect(ruleIds).toContain('storybook/default-exports');
  });

  it('passes a clean story file', async () => {
    const ruleIds = await ruleIdsFor(layer(), CLEAN, STORY_PATH);
    expect(ruleIds).toStrictEqual([]);
  });

  it('leaves a component alone', async () => {
    const ruleIds = await ruleIdsFor(layer(), NO_DEFAULT, 'src/components/button/buttonModel.ts');
    expect(ruleIds).not.toContain('storybook/default-exports');
  });

  it('enables no framework rule on a story file', async () => {
    const leaked = await frameworkRuleIdsFor(layer(), STORY_PATH);

    expect(leaked).toStrictEqual([]);
  });

  it('names flat/recommended when eslint-plugin-storybook stops publishing it', async () => {
    const stripped = await layerWithoutConfig('eslint-plugin-storybook', 'flat/recommended', async () => {
      const storybookLayer = await import('./storybookLayer');
      return storybookLayer.storybook;
    });

    expect(stripped).toThrow('storybook/flat/recommended is not published');
  });
});
