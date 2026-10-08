import { useNuxtApp } from 'nuxt/app';

import { dataProvider } from '@lib/providers/data/dataProvider';

import plugin from './data';

vi.mock('@lib/providers/data/dataProvider', () => {
  const provider = { dataProvider: vi.fn() };

  return provider;
});

describe('the data plugin', () => {
  it('installs the data provider on the Nuxt app', async () => {
    const nuxtApp = useNuxtApp();

    await plugin(nuxtApp);

    expect(dataProvider).toHaveBeenCalledWith(nuxtApp.vueApp);
  });
});
