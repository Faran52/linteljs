import { ANSWERS } from '../registry';

import { migrateForm } from './migrationUtils';

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
