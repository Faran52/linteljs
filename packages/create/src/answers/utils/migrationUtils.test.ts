import { ANSWERS } from '../registry';

import { migratedStore, migrateLifted } from './migrationUtils';

describe('migrateLifted', () => {
  it('lifts nothing out of a nested list, however its text reads', () => {
    const lifted = migrateLifted({ libraries: [['react-hook-form']] }, true, 'form', ANSWERS.form.values);
    const expected = { libraries: [['react-hook-form']] };

    expect(lifted)
      .toStrictEqual(expected);
  });

  it('leaves a config alone where the lift does not apply', () => {
    const lifted = migrateLifted({ libraries: ['zod', 'react-hook-form'] }, false, 'form', ANSWERS.form.values);
    const expected = { libraries: ['zod', 'react-hook-form'] };

    expect(lifted)
      .toEqual(expected);
  });

  it('leaves a config alone when its libraries name none of the lifted values', () => {
    const lifted = migrateLifted({ libraries: ['zod'] }, true, 'form', ANSWERS.form.values);
    const expected = { libraries: ['zod'] };

    expect(lifted)
      .toStrictEqual(expected);
  });

  it('lifts the one value listed out of libraries and into its own field', () => {
    const lifted = migrateLifted({ libraries: ['zod', 'react-hook-form'] }, true, 'form', ANSWERS.form.values);
    const expected = {
      libraries: ['zod'],
      form: 'react-hook-form',
    };
    expect(lifted).toEqual(expected);
  });

  it('lifts tailwind into styling and tanstack-query into data, which v2 lifts alongside the form library', () => {
    const stylingLifted = migrateLifted({ libraries: ['zod', 'tailwind'] }, true, 'styling', ANSWERS.styling.values);
    const expectedStyling = {
      libraries: ['zod'],
      styling: 'tailwind',
    };
    expect(stylingLifted).toEqual(expectedStyling);

    const dataLifted = migrateLifted({ libraries: ['tanstack-query'] }, true, 'data', ANSWERS.data.values);
    const expectedData = {
      libraries: [],
      data: 'tanstack-query',
    };
    expect(dataLifted).toEqual(expectedData);
  });

  it('refuses a config listing two, which the field it lifts into has no room for', () => {
    expect(() => {
      return migrateLifted({ libraries: ['tanstack-form', 'react-hook-form'] }, true, 'form', ANSWERS.form.values);
    }).toThrow('libraries must contain at most one of: tanstack-form, react-hook-form');
  });
});

describe('migratedStore', () => {
  const offered = (): string | undefined => {
    return 'zustand';
  };

  it('lands a yes on the store that question was about', () => {
    const actual = migratedStore(true, offered);
    expect(actual).toBe('zustand');
  });

  it('answers nothing for a no, which is an absent answer rather than a false', () => {
    const actual = migratedStore(false, offered);
    expect(actual).toBeUndefined();
  });

  it('answers nothing where the target offers no store at all', () => {
    const actual = migratedStore(true, () => {
      return undefined;
    });
    expect(actual).toBeUndefined();
  });
});
