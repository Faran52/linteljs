import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Answers } from '@answers';

import {
  hasForm,
  hasStore,
  pressable,
} from './gateUtils';

describe('the starter gates', () => {
  it.each<[string, Partial<Answers>, boolean, boolean, boolean]>([
    ['neither', {}, false, false, false],
    ['a store', { store: 'zustand' }, true, false, true],
    ['a form', { form: 'tanstack-form' }, false, true, true],
    ['both', {
      store: 'zustand',
      form: 'tanstack-form',
    }, true, true, true],
  ])('reads %s as store %s, form %s, pressable %s', (_case, overrides, store, form, press) => {
    const answers = answersFor(overrides);

    expect([hasStore(answers), hasForm(answers), pressable(answers)]).toEqual([store, form, press]);
  });
});
