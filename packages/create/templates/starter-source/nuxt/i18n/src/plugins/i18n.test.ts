import { createApp } from 'vue';
import {
  type NuxtApp,
  onNuxtReady,
  useHead,
} from 'nuxt/app';

import {
  applyLanguage,
  i18n,
} from '../i18n';
import { languages, languageStorageKey } from '../i18n/config';

import './i18n';

type Setup = (nuxtApp: Pick<NuxtApp, 'vueApp'>) => void;

// The plugin's setup, kept to run against a real app in each case.
const nuxt = vi.hoisted(() => {
  const setups: Setup[] = [];

  return { setups };
});

vi.mock('nuxt/app', () => {
  return {
    defineNuxtPlugin: (setup: Setup) => {
      nuxt.setups.push(setup);
    },
    onNuxtReady: vi.fn(),
    useHead: vi.fn(),
  };
});

const last = languages.at(-1)?.id ?? 'en';

const install = (): ReturnType<typeof createApp>['use'] => {
  const vueApp = createApp({});
  const use = vi.spyOn(vueApp, 'use');

  nuxt.setups[0]?.({ vueApp });

  return use;
};

const ready = (): void => {
  const [callback] = vi.mocked(onNuxtReady).mock.lastCall ?? [];

  callback?.();
};

describe('the i18n plugin', () => {
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
    vi.restoreAllMocks();
  });

  it('installs the one i18n on the app', () => {
    const use = install();

    expect(use).toHaveBeenCalledWith(i18n);
  });

  it('renders English until the app is ready, then the browser language, storing nothing', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([last]);
    install();

    expect(i18n.global.locale.value).toBe('en');

    ready();

    expect(i18n.global.locale.value).toBe(last);
    expect(localStorage.getItem(languageStorageKey)).toBeNull();
  });

  it.each(languages)('keeps the head lang and dir on $id', ({ id, dir }) => {
    install();
    applyLanguage(id);

    expect(useHead).toHaveBeenLastCalledWith({
      htmlAttrs: {
        lang: expect.objectContaining({ value: id }),
        dir: expect.objectContaining({ value: dir }),
      },
    });
  });
});
