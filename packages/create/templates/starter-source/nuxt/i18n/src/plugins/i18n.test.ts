import { createApp, type Ref } from 'vue';
import {
  type NuxtApp,
  onNuxtReady,
} from 'nuxt/app';

import {
  applyLanguage,
  i18n,
} from '@i18n';
import { languages, languageStorageKey } from '@i18n/config';

import './i18n';

type Setup = (nuxtApp: Pick<NuxtApp, 'vueApp'>) => void;

interface Head {
  htmlAttrs: Record<'lang' | 'dir', Readonly<Ref<string>>>;
}

// The plugin's setup, kept to run against a real app in each case, and the head it hands Nuxt.
const nuxt = vi.hoisted(() => {
  const setups: Setup[] = [];
  const heads: Head[] = [];

  return {
    setups,
    heads,
  };
});

vi.mock('nuxt/app', () => {
  return {
    defineNuxtPlugin: (setup: Setup) => {
      nuxt.setups.push(setup);
    },
    onNuxtReady: vi.fn(),
    useHead: (head: Head) => {
      nuxt.heads.push(head);
    },
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

    const htmlAttrs = nuxt.heads.at(-1)?.htmlAttrs;

    expect(htmlAttrs?.lang.value).toBe(id);
    expect(htmlAttrs?.dir.value).toBe(dir);
  });
});
