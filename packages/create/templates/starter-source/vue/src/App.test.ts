import { mount } from '@vue/test-utils';

import App from './App.vue';
import { dataProvider } from './lib/providers/data/dataProvider';
import { storeProvider } from './lib/providers/store/storeProvider';
import { router } from './router';
import { ROUTES } from './views/routes';

const open = async (path: string): Promise<ReturnType<typeof mount>> => {
  await router.push(path);
  await router.isReady();

  return mount(App, { global: { plugins: [router, storeProvider, dataProvider] } });
};

describe('App', () => {
  it('opens on the home page', async () => {
    const app = await open('/');

    const drawn = app
      .find('svg[role="img"]')
      .exists();
    const header = app
      .find('header')
      .text();

    expect(drawn).toBe(true);
    expect(header).toContain('LintelJS Starter');
  });

  it('links to every page the route list names', async () => {
    const app = await open('/');
    const labels = app
      .findAll('nav a')
      .map((tab) => {
        return tab.text();
      });

    const expected = ROUTES
      .map((route) => {
        return route.label;
      });

    expect(labels).toEqual(expected);
  });

  it('routes to the other pages', async () => {
    expect((await open('/about'))
      .find('.page-title')
      .text()).toBe('About');
    expect((await open('/version'))
      .find('.page-title')
      .text()).toBe('Version');
  });
});
