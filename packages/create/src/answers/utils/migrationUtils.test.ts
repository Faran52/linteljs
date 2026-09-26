import { ANSWERS } from '../registry';

import { migratedStore, migrateLifted } from './migrationUtils';

describe('migrateLifted', () => {
  it('leaves a config alone where the lift does not apply', () => {
    expect(migrateLifted({ libraries: ['zod', 'react-hook-form'] }, false, 'form', ANSWERS.form.values))
      .toEqual({ libraries: ['zod', 'react-hook-form'] });
  });

  it('leaves a config alone when its libraries name none of the lifted values', () => {
    // Strict: nothing lifted writes no field, rather than one set to `undefined` over what the file already had.
    expect(migrateLifted({ libraries: ['zod'] }, true, 'form', ANSWERS.form.values))
      .toStrictEqual({ libraries: ['zod'] });
  });

  it('lifts the one value listed out of libraries and into its own field', () => {
    expect(migrateLifted({ libraries: ['zod', 'react-hook-form'] }, true, 'form', ANSWERS.form.values)).toEqual({
      libraries: ['zod'],
      form: 'react-hook-form',
    });
  });

  // Every version so far has lifted one single select out of the multi select it was hiding inside.
  it('lifts tailwind into styling and tanstack-query into data, which v2 lifts alongside the form library', () => {
    expect(migrateLifted({ libraries: ['zod', 'tailwind'] }, true, 'styling', ANSWERS.styling.values)).toEqual({
      libraries: ['zod'],
      styling: 'tailwind',
    });
    expect(migrateLifted({ libraries: ['tanstack-query'] }, true, 'data', ANSWERS.data.values)).toEqual({
      libraries: [],
      data: 'tanstack-query',
    });
  });

  it('refuses a config listing two, which the field it lifts into has no room for', () => {
    expect(() => {
      return migrateLifted({ libraries: ['tanstack-form', 'react-hook-form'] }, true, 'form', ANSWERS.form.values);
    }).toThrow('libraries must contain at most one of: tanstack-form, react-hook-form');
  });
});

/**
 * v1 required `store` and wrote a boolean, because a target offered exactly one. The vocabulary has names now, so a
 * yes has to become one before anything reads it. Which versions this runs for is the parser's, and its own suite
 * holds that end.
 */
describe('migratedStore', () => {
  const offered = (): string | undefined => {
    return 'zustand';
  };

  it('lands a yes on the store that question was about', () => {
    expect(migratedStore(true, offered)).toBe('zustand');
  });

  it('answers nothing for a no, which is an absent answer rather than a false', () => {
    expect(migratedStore(false, offered)).toBeUndefined();
  });

  // A target that offers none, read from a config that still says yes: there is nothing to land on.
  it('answers nothing where the target offers no store at all', () => {
    expect(migratedStore(true, () => {
      return undefined;
    })).toBeUndefined();
  });
});
