import { mount } from '@vue/test-utils';

import App from './App.vue';
import { installData } from './lib/providers/installData';
import { installStore } from './lib/providers/installStore';
import { router } from './router';
import { ROUTES } from './views/routes';

/*
 * Mounted through the real router rather than a stub, and through both slots the entry installs: Pinia is a plugin
 * on the app, so a view that reads a store renders nothing without it, and TanStack Query wants its client. With
 * the other answers both install nothing and this costs a line each.
 */
const open = async (path: string): Promise<ReturnType<typeof mount>> => {
  await router.push(path);
  await router.isReady();

  return mount(App, { global: { plugins: [router, installStore, installData] } });
};

describe('App', () => {
  it('opens on the home page', async () => {
    const app = await open('/');

    expect(app.find('svg[role="img"]').exists()).toBe(true);
  });

  /*
   * The header links rather than swapping from state, because this target routes whatever was answered. Found by
   * the nav around them rather than by class: under StyleX a class is a compiled atomic name, so a suite that
   * spelled one would be testing the styling answer instead of the markup. Read off
   * the route list rather than spelled out, so a page the form answer adds appears here without this file
   * changing: that the two agree is the whole point of there being one list.
   */
  it('links to every page the route list names', async () => {
    const app = await open('/');
    const labels = app.findAll('nav a').map((tab) => {
      return tab.text();
    });

    expect(labels).toEqual(ROUTES.map((route) => {
      return route.label;
    }));
  });

  it('routes to the other pages', async () => {
    expect((await open('/about')).find('.page-title').text()).toBe('About');
    expect((await open('/version')).find('.page-title').text()).toBe('Version');
  });
});
