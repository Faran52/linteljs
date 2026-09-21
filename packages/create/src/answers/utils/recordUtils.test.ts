import { targetFor } from '@targets';

import { formAnswer } from '../libraries/form/formAnswer';
import { DEFAULT_ANSWERS } from '../registry';
import { storeAnswer } from '../target/store/storeAnswer';

import { onlyFor } from './recordUtils';

describe('onlyFor', () => {
  it('answers the predicate the chosen value carries', () => {
    const only = onlyFor(formAnswer, 'react-hook-form');

    expect(only?.(targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    }))).toBe(true);
    expect(only?.(targetFor({
      ...DEFAULT_ANSWERS,
      target: 'vue',
    }))).toBe(false);
  });

  it('answers undefined where there is no predicate to answer with', () => {
    // Three ways to have none: a value carrying no `only`, a value the record does not offer, and a record
    // that carries no `values` at all.
    expect(onlyFor(formAnswer, 'tanstack-form')).toBeUndefined();
    expect(onlyFor(formAnswer, 'formik')).toBeUndefined();
    expect(onlyFor(storeAnswer, 'true')).toBeUndefined();
  });
});
