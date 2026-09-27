import { mount } from '@vue/test-utils';

import App from './App.vue';
import { installData } from './lib/providers/installData';
import { installStore } from './lib/providers/installStore';
import { router } from './router';
import { ROUTES } from './views/routes';

const open = async (path: string): Promise<ReturnType<typeof mount>> => {
  await router.push(path);
  await router.isReady();

  return mount(App, { global: { plugins: [router, installStore, installData] } });
};

describe('App', () => {
  it('opens on the home page', async () => {
    const app = await open('/');

    const drawn = app
      .find('svg[role="img"]')
      .exists();

    expect(drawn).toBe(true);
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
