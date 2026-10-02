import { targetFor } from '@targets';

import { dataAnswer } from '../libraries/data/dataAnswer';
import { formAnswer } from '../libraries/form/formAnswer';
import { nodeVersionAnswer } from '../recorded/node-version/nodeVersionAnswer';
import { DEFAULT_ANSWERS } from '../registry';

import { onlyFor, refusedValue } from './recordUtils';

describe('refusedValue', () => {
  const vue = targetFor({
    ...DEFAULT_ANSWERS,
    target: 'vue',
  });

  it('names the value its target refuses, and nothing where it fits', () => {
    const actual = refusedValue(formAnswer, 'react-hook-form', vue, DEFAULT_ANSWERS);
    expect(actual).toBe('react-hook-form');
    const actual2 = refusedValue(formAnswer, 'react-hook-form', targetFor(DEFAULT_ANSWERS), DEFAULT_ANSWERS);
    expect(actual2).toBeUndefined();
  });

  it('refuses nothing that is not a string, however it reads', () => {
    const actual = refusedValue(formAnswer, ['react-hook-form'], vue, DEFAULT_ANSWERS);
    expect(actual).toBeUndefined();
  });
});

describe('onlyFor', () => {
  it('answers the predicate the chosen value carries', () => {
    const only = onlyFor(formAnswer, 'react-hook-form');

    const onReact = only?.(targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    }), DEFAULT_ANSWERS);

    expect(onReact).toBe(true);

    const onVue = only?.(targetFor({
      ...DEFAULT_ANSWERS,
      target: 'vue',
    }), DEFAULT_ANSWERS);

    expect(onVue).toBe(false);
  });

  it('answers a predicate that reads the answers rather than the target', () => {
    const only = onlyFor(dataAnswer, 'rtk-query');
    const target = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    const withRedux = only?.(target, {
      ...DEFAULT_ANSWERS,
      store: 'redux-toolkit',
    });

    expect(withRedux).toBe(true);

    const withZustand = only?.(target, {
      ...DEFAULT_ANSWERS,
      store: 'zustand',
    });

    expect(withZustand).toBe(false);
  });

  it('answers undefined where there is no predicate to answer with', () => {
    const only = onlyFor(formAnswer, 'tanstack-form');
    expect(only).toBeUndefined();
    const formAnswerOnly = onlyFor(formAnswer, 'formik');
    expect(formAnswerOnly).toBeUndefined();
    const nodeVersionAnswerOnly = onlyFor(nodeVersionAnswer, '26.1.0');
    expect(nodeVersionAnswerOnly).toBeUndefined();
  });
});
