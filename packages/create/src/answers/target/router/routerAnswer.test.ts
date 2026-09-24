import { targetFor } from '#targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { routerAnswer } from './routerAnswer';

describe('routerAnswer', () => {
  it('is keyed router', () => {
    expect(routerAnswer.key).toBe('router');
  });

  it('takes a slot on a target that carries routers and on no other', () => {
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });
    const vue = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'vue',
    });

    expect(routerAnswer.slot(react)).toBe(true);
    expect(routerAnswer.slot(vue)).toBe(false);
  });

  /**
   * The slot decides whether the question is asked; `only` decides which of the two values it offers. React is the
   * one target with routers today and it lists both, so the pair is asked of a record narrowed to one: that is the
   * case the predicate exists for, and the only input that tells it apart from the slot above.
   */
  it('offers each router only to a target that lists it', () => {
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });
    const declarativeOnly = {
      ...react,
      routers: ['react-router'],
    } as const;

    expect(routerAnswer.values['react-router'].only(react)).toBe(true);
    expect(routerAnswer.values['tanstack-router'].only(react)).toBe(true);
    expect(routerAnswer.values['react-router'].only(declarativeOnly)).toBe(true);
    expect(routerAnswer.values['tanstack-router'].only(declarativeOnly)).toBe(false);
  });
});
