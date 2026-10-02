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

    const onReact = routerAnswer.slot(react);
    expect(onReact).toBe(true);
    const onVue = routerAnswer.slot(vue);
    expect(onVue).toBe(false);
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

    const declarativeOnReact = routerAnswer.values['react-router'].only(react);
    expect(declarativeOnReact).toBe(true);
    const tanstackOnReact = routerAnswer.values['tanstack-router'].only(react);
    expect(tanstackOnReact).toBe(true);
    const frameworkOnReact = routerAnswer.values['react-router-framework'].only(react);
    expect(frameworkOnReact).toBe(true);
    const declarativeOnDeclarative = routerAnswer.values['react-router'].only(declarativeOnly);
    expect(declarativeOnDeclarative).toBe(true);
    const tanstackOnDeclarative = routerAnswer.values['tanstack-router'].only(declarativeOnly);
    expect(tanstackOnDeclarative).toBe(false);
    const frameworkOnDeclarative = routerAnswer.values['react-router-framework'].only(declarativeOnly);
    expect(frameworkOnDeclarative).toBe(false);
  });
});
