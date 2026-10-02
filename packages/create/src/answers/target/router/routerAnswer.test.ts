import { targetFor } from '@targets';

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

    const actual = routerAnswer.slot(react);
    expect(actual).toBe(true);
    const actual2 = routerAnswer.slot(vue);
    expect(actual2).toBe(false);
  });

  it('offers each router only to a target that lists it', () => {
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });
    const declarativeOnly = {
      ...react,
      routers: ['react-router'],
    } as const;

    const actual = routerAnswer.values['react-router'].only(react);
    expect(actual).toBe(true);
    const actual2 = routerAnswer.values['tanstack-router'].only(react);
    expect(actual2).toBe(true);
    const actual3 = routerAnswer.values['react-router-framework'].only(react);
    expect(actual3).toBe(true);
    const actual4 = routerAnswer.values['react-router'].only(declarativeOnly);
    expect(actual4).toBe(true);
    const actual5 = routerAnswer.values['tanstack-router'].only(declarativeOnly);
    expect(actual5).toBe(false);
    const actual6 = routerAnswer.values['react-router-framework'].only(declarativeOnly);
    expect(actual6).toBe(false);
  });
});
