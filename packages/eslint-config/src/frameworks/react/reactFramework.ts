import jsxA11y from 'eslint-plugin-jsx-a11y-x';

import { SCRIPT_FILES } from '../../config/constants';
import { presetOf } from '../../utils/presetUtils';
import { reactCore, reactGroup } from '../utils/reactCoreUtils';

import type { Layer } from '../../types';

export { reactGroup };

export const react = (): Layer => {
  const layer: Layer = [
    ...reactCore(),
    ...presetOf(jsxA11y.configs.recommended, 'jsx-a11y-x/recommended', SCRIPT_FILES),

    // DOM only, so not in `reactCore()`, which React Native shares.
    {
      name: '@linteljs/react/dom',
      files: SCRIPT_FILES,
      rules: {
        '@eslint-react/dom-no-missing-button-type': 'error',
        '@eslint-react/dom-no-missing-iframe-sandbox': 'error',
        '@eslint-react/dom-no-script-url': 'error',
        '@eslint-react/dom-no-unsafe-target-blank': 'error',
      },
    },
  ];

  return layer;
};

export default react;
