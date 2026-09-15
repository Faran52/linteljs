import router from '@tanstack/eslint-plugin-router';

import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

// A library layer like `tanstackQuery`: its rules catch a route option that has to be a stable reference.
export const tanstackRouter = (): Layer => {
  return presetOf(router.configs['flat/recommended'], 'tanstack-router/flat/recommended');
};

export default tanstackRouter;
