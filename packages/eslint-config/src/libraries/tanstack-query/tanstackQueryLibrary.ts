import query from '@tanstack/eslint-plugin-query';

import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

// A library layer, so it stacks on whichever framework layer is in play. Its rules catch the
// two mistakes the type system cannot: an unstable query key, a hook called outside a component.
export const tanstackQuery = (): Layer => {
  return presetOf(query.configs['flat/recommended'], 'tanstack-query/flat/recommended');
};

export default tanstackQuery;
