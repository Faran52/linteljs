import { isValueOf, keysOf } from '@utils/objectUtils';

import { isJsonArray, type JsonValue } from './readUtils';

// Lift before members are checked against today's vocabulary, or a valid older file fails.
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
    throw new Error(`libraries must contain at most one of: ${keysOf(values).join(', ')}`);
  }

  const [only] = lifted;

  if (only === undefined) {
    return parsed;
  }

  const migrated = {
    ...parsed,
    libraries: listed
      .filter((library) => {
        return !isLifted(library);
      }),
    [field]: only,
  };

  return migrated;
};

// A v1 yes is the first store the target offers now; anything else is no answer.
export const migratedStore = (store: JsonValue | undefined, offered: () => string | undefined): string | undefined => {
  return store === true ? offered() : undefined;
};
