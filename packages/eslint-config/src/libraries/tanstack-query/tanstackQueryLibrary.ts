import query from '@tanstack/eslint-plugin-query';

import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

export const tanstackQuery = (): Layer => {
  return presetOf(query.configs['flat/recommended'], 'tanstack-query/flat/recommended');
};

export default tanstackQuery;
