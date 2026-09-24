import { targetFor } from '#targets';

import { dataAnswer } from '../libraries/data/dataAnswer';
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
    }), DEFAULT_ANSWERS)).toBe(true);
    expect(only?.(targetFor({
      ...DEFAULT_ANSWERS,
      target: 'vue',
    }), DEFAULT_ANSWERS)).toBe(false);
  });

  // The second argument is why this is a predicate rather than a target check: `rtk-query` is legal or not by
  // another answer, and the prompt and the parser have to agree about which.
  it('answers a predicate that reads the answers rather than the target', () => {
    const only = onlyFor(dataAnswer, 'rtk-query');
    const target = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    expect(only?.(target, {
      ...DEFAULT_ANSWERS,
      store: 'redux-toolkit',
    })).toBe(true);
    expect(only?.(target, {
      ...DEFAULT_ANSWERS,
      store: 'zustand',
    })).toBe(false);
  });

  it('answers undefined where there is no predicate to answer with', () => {
    // Three ways to have none: a value carrying no `only`, a value the record does not offer, and a record
    // that carries no `values` at all.
    expect(onlyFor(formAnswer, 'tanstack-form')).toBeUndefined();
    expect(onlyFor(formAnswer, 'formik')).toBeUndefined();
    expect(onlyFor(storeAnswer, 'true')).toBeUndefined();
  });
});
