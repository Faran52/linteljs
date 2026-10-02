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

    expect([
      hasStore(answers),
      hasForm(answers),
    ]).toEqual([store, form]);
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

    expect(applies).toEqual([
      true,
      true,
      false,
    ]);
  });
});

describe('hasI18n', () => {
  it('holds once any language is chosen', () => {
    expect(hasI18n(answersFor({}))).toBe(false);
    expect(hasI18n(answersFor({ languages: [] }))).toBe(false);
    expect(hasI18n(answersFor({ languages: ['ko'] }))).toBe(true);
  });
});
