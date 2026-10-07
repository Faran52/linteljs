import { type App, createApp } from 'vue';

import { dataProvider } from '@lib/providers/data/dataProvider';

import './data';

interface NuxtApp {
  vueApp: App;
}

type Setup = (nuxtApp: NuxtApp) => void;

const nuxt = vi.hoisted(() => {
  const setups: Setup[] = [];
  const registry = { setups };

  return registry;
});

vi.mock('nuxt/app', () => {
  const nuxtApp = {
    defineNuxtPlugin: (setup: Setup) => {
      nuxt.setups.push(setup);
    },
  };

  return nuxtApp;
});

vi.mock('@lib/providers/data/dataProvider', () => {
  const provider = { dataProvider: vi.fn() };

  return provider;
});

describe('the data plugin', () => {
  it('installs the data provider on the Nuxt app', () => {
    const vueApp = createApp({});

    nuxt.setups[0]?.({ vueApp });

    expect(dataProvider).toHaveBeenCalledWith(vueApp);
  });
});
