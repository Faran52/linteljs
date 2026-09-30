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

describe('hasI18n', () => {
  it('holds once any language is chosen', () => {
    expect(hasI18n(answersFor({}))).toBe(false);
    expect(hasI18n(answersFor({ languages: [] }))).toBe(false);
    expect(hasI18n(answersFor({ languages: ['ko'] }))).toBe(true);
  });
});
