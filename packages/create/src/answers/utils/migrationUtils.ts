import { isValueOf, valuesOf } from '@utils/objectUtils';

import { isJsonArray, type JsonValue } from './readUtils';

/**
 * Every version so far has lifted one single select out of `libraries` into a field of its own: v1 kept the form
 * library there, and v2 kept `tailwind` and `tanstack-query`. Lift before the members are checked against today's
 * vocabulary, or a valid older file fails as an unknown library. Silent, the way an absent `surfaces` still
 * describes its project.
 *
 * Generic over the caller's own parsed-object type, so a lift leaves every other key's type exactly as the caller
 * had it. `field` is a key of that type rather than a free string, so a typo cannot write a property nothing reads.
 */
export const migrateLifted = <
  V extends string,
  K extends string,
  P extends Partial<Record<K | 'libraries', JsonValue>>,
>(
  parsed: P,
  applies: boolean,
  field: K,
  values: Record<V, unknown>,
): P => {
  const listed = parsed.libraries;

  if (!applies || !isJsonArray(listed)) {
    return parsed;
  }

  const isLifted = (item: JsonValue): item is V => {
    return typeof item === 'string' && isValueOf(item, values);
  };

  const lifted = listed.filter(isLifted);

  if (lifted.length > 1) {
    throw new Error(`libraries must contain at most one of: ${valuesOf(values).join(', ')}`);
  }

  const [only] = lifted;

  if (only === undefined) {
    return parsed;
  }

  return {
    ...parsed,
    libraries: listed.filter((library) => {
      return !isLifted(library);
    }),
    [field]: only,
  };
};

/**
 * What a v1 `store` meant. It was required and written as a yes or no, because a target offered exactly one: a yes
 * is the store that question was about, which is the first one the target offers now, and anything else is no
 * answer at all, including a yes on a target that has since stopped offering any.
 *
 * Which versions this runs for is the parser's business, next to what it does with `$schema`.
 */
export const migratedStore = (store: JsonValue | undefined, offered: () => string | undefined): string | undefined => {
  return store === true ? offered() : undefined;
};
