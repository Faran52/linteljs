import jsxA11y from 'eslint-plugin-jsx-a11y-x';

import { SCRIPT_FILES } from '../../config/globs';
import { presetOf } from '../../utils/presetUtils';
import { reactCore, reactGroup } from '../utils/reactCoreUtils';

import type { Layer } from '../../types';

export { reactGroup };

// Accessibility is a property of JSX, so it lives here rather than in `next()`, and as the plugin's full
// `recommended` rather than the six rules `eslint-config-next` picked.
export const react = (): Layer => {
  return [
    ...reactCore(),
    ...presetOf(jsxA11y.configs.recommended, 'jsx-a11y-x/recommended', SCRIPT_FILES),
  ];
};

export default react;
