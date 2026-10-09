import storybookPlugin from 'eslint-plugin-storybook';

import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

// The preset scopes itself: script stories, and `.storybook/main.*` for the addon check.
export const storybook = (): Layer => {
  const layer = presetOf(storybookPlugin.configs['flat/recommended'], 'storybook/flat/recommended');

  return layer;
};

export default storybook;
