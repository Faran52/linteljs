import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  hasForm,
  hasI18n,
  hasStore,
  starterApplies,
} from './gateUtils';

import type { Answers } from '@config/types';

describe('the starter gates', () => {
  it.each<[string, Partial<Answers>, boolean, boolean]>([
    [
      'neither',
      {},
      false,
      false,
    ],
    [
      'a store',
      { store: 'zustand' },
      true,
      false,
    ],
    [
      'a form',
      { form: 'tanstack-form' },
      false,
      true,
    ],
    [
      'both',
      {
        store: 'zustand',
        form: 'tanstack-form',
      },
      true,
      true,
    ],
  ])('reads %s as store %s, form %s', (_case, overrides, store, form) => {
    const answers = answersFor(overrides);

    const actual = [
      hasStore(answers),
      hasForm(answers),
    ];
    const expected = [store, form];
    expect(actual).toEqual(expected);
  });
});

describe('starterApplies', () => {
  it('writes a starter with no gate, and one whose gate holds', () => {
    const answers = answersFor({ form: 'tanstack-form' });
    const applies = [
      starterApplies({ target: 'src/a.ts' }, answers),
      starterApplies({
        target: 'src/a.ts',
        when: hasForm,
      }, answers),
      starterApplies({
        target: 'src/a.ts',
        when: hasStore,
      }, answers),
    ];

    const expected = [
      true,
      true,
      false,
    ];
    expect(applies).toEqual(expected);
  });
});

describe('hasI18n', () => {
  it('holds once any language is chosen', () => {
    const actual = hasI18n(answersFor({}));
    expect(actual).toBe(false);
    const actual2 = hasI18n(answersFor({ languages: [] }));
    expect(actual2).toBe(false);
    const actual3 = hasI18n(answersFor({ languages: ['ko'] }));
    expect(actual3).toBe(true);
  });
});
