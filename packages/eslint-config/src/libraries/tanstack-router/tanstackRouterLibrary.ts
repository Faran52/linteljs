import router from '@tanstack/eslint-plugin-router';

import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

export const tanstackRouter = (): Layer => {
  return presetOf(router.configs['flat/recommended'], 'tanstack-router/flat/recommended');
};

export default tanstackRouter;
