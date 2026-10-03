import { mount } from '@vue/test-utils';

import { dataProvider } from '@lib/providers/data/dataProvider';
import { storeProvider } from '@lib/providers/store/storeProvider';

import { ROUTES } from '@views/routes';

import App from './App.vue';
import { router } from './router';

const open = async (path: string): Promise<ReturnType<typeof mount>> => {
  await router.push(path);
  await router.isReady();

  return mount(App, { global: { plugins: [
    router,
    storeProvider,
    dataProvider,
  ] } });
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
    const about = await open('/about');
    const aboutTitle = about
      .find('.page-title')
      .text();
    expect(aboutTitle).toBe('About');

    const version = await open('/version');
    const versionTitle = version
      .find('.page-title')
      .text();
    expect(versionTitle).toBe('Version');
  });

  it('shows the 404 page, under the header, for a path no route matches', async () => {
    const app = await open('/missing');

    const actual = app
      .find('h1')
      .text();
    expect(actual).toBe('404');

    const actual2 = app
      .find('header')
      .exists();
    expect(actual2).toBe(true);
  });
});
