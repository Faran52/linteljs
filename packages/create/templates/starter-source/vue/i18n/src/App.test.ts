import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import App from './App.vue';
import { applyLanguage, directionOf } from './i18n';
import {
  languages,
  languageStorageKey,
  resources,
} from './i18n/config';
import { dataProvider } from './lib/providers/data/dataProvider';
import { storeProvider } from './lib/providers/store/storeProvider';
import { router } from './router';
import { ROUTES } from './views/routes';

type Bundle = Readonly<Record<string, string>>;

const last = languages.at(-1)?.id ?? 'en';

const english: Bundle = resources.en.common;
const chosen: Bundle = resources[last].common;

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
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
  });

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

  it('links to every page the route list names, each in its own words', async () => {
    const app = await open('/');
    const labels = app
      .findAll('nav a')
      .map((tab) => {
        return tab.text();
      });

    const expected = ROUTES
      .map((route) => {
        return english[route.id];
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

  it('switches every page from the header, and stores the choice', async () => {
    const app = await open('/');

    await app
      .find('header select')
      .setValue(last);

    const headings: string[] = [];

    for (const route of ROUTES.slice(1)) {
      await router.push(route.path);
      await nextTick();

      headings.push(app
        .find('.page-title')
        .text());
    }

    const expected = ROUTES
      .slice(1)
      .map((route) => {
        return chosen[route.id];
      });

    expect(headings).toEqual(expected);
    const item = localStorage.getItem(languageStorageKey);
    expect(item).toBe(last);
    expect(document.documentElement.dir).toBe(directionOf(last));
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
