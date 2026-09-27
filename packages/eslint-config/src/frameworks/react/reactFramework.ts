import jsxA11y from 'eslint-plugin-jsx-a11y-x';

import { SCRIPT_FILES } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';
import { reactCore, reactGroup } from '../utils/reactCoreUtils';

import type { Layer } from '../../types';

export { reactGroup };

export const react = (): Layer => {
  return [
    ...reactCore(),
    ...presetOf(jsxA11y.configs.recommended, 'jsx-a11y-x/recommended', SCRIPT_FILES),
  ];
};

export default react;
