import { valuesOf } from '@utils/objectUtils';

import { isJsonArray, isValueOf } from './readUtils';

import type { JsonValue } from './readUtils';

/**
 * v1 kept the form library inside `libraries`. Lift it before the members are checked against today's vocabulary,
 * or a valid v1 file fails as an unknown library. Silent, the way an absent `surfaces` still describes its project.
 * Generic over the caller's own parsed-object type, so migrating `form`/`libraries` leaves every other key's type
 * exactly as the caller had it.
 */
export const migrateForm = <
  F extends string,
  P extends Partial<Record<'form' | 'libraries', JsonValue>>,
>(
  parsed: P,
  schemaVersion: number,
  formValues: Record<F, unknown>,
): P => {
  const listed = parsed.libraries;

  if (schemaVersion !== 1 || !isJsonArray(listed)) {
    return parsed;
  }

  const isForm = (item: JsonValue): item is F => {
    return typeof item === 'string' && isValueOf(item, formValues);
  };

  const forms = listed.filter(isForm);

  if (forms.length > 1) {
    throw new Error(`libraries must contain at most one of: ${valuesOf(formValues).join(', ')}`);
  }

  const [form] = forms;

  if (form === undefined) {
    return parsed;
  }

  return {
    ...parsed,
    libraries: listed.filter((library) => {
      return !isForm(library);
    }),
    form,
  };
};
