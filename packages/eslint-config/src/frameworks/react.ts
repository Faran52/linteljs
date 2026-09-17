import jsxA11y from 'eslint-plugin-jsx-a11y-x';

import { presetOf } from '../utils/presetUtils';

import {
  REACT_FILES,
  reactCore,
  reactGroup,
} from './reactCore';

import type { Layer } from '../types';

export { reactGroup };

// Accessibility is a property of JSX, so it lives here rather than in `next()`, and as the plugin's full
// `recommended` rather than the six rules `eslint-config-next` picked.
export const react = (): Layer => {
  return [
    ...reactCore(),
    ...presetOf(jsxA11y.configs.recommended, 'jsx-a11y-x/recommended', REACT_FILES),
  ];
};

export default react;
