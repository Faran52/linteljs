import { ANSWERS } from '../registry';

import { migratedStore, migrateForm } from './migrationUtils';

describe('migrateForm', () => {
  it('leaves a v2 config alone, form library or not', () => {
    expect(migrateForm({ libraries: ['zod', 'react-hook-form'] }, 2, ANSWERS.form.values))
      .toEqual({ libraries: ['zod', 'react-hook-form'] });
  });

  it('leaves a v1 config alone when its libraries name no form', () => {
    expect(migrateForm({ libraries: ['zod'] }, 1, ANSWERS.form.values)).toEqual({ libraries: ['zod'] });
  });

  it('lifts the one form a v1 config lists out of libraries', () => {
    expect(migrateForm({ libraries: ['zod', 'react-hook-form'] }, 1, ANSWERS.form.values)).toEqual({
      libraries: ['zod'],
      form: 'react-hook-form',
    });
  });

  it('refuses a v1 config listing two forms, which v2 has no field for', () => {
    expect(() => {
      return migrateForm({ libraries: ['tanstack-form', 'react-hook-form'] }, 1, ANSWERS.form.values);
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
