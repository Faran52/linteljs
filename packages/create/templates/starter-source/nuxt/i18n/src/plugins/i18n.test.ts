import {
  type App,
  createApp,
  type Ref,
  ref,
} from 'vue';

import {
  applyLanguage,
  i18n,
} from '@i18n';
import { languages, languageStorageKey } from '@i18n/config';
import { languageCookie } from '@i18n/utils/cookieUtils';

import './i18n';

// The two fields the plugin reads: any `ssrContext` marks the render as the server's.
interface PluginApp {
  vueApp: App;
  ssrContext: object | undefined;
}

type Setup = (nuxtApp: PluginApp) => void;

interface Head {
  htmlAttrs: Record<'lang' | 'dir', Readonly<Ref<string>>>;
}

// The plugin's setup, kept to run against a real app in each case, the head it hands Nuxt and the request it reads.
const nuxt = vi.hoisted(() => {
  const setups: Setup[] = [];
  const heads: Head[] = [];
  const request: Record<string, string> = {};

  const captured = {
    setups,
    heads,
    request,
  };

  return captured;
});

vi.mock('nuxt/app', () => {
  const nuxtApp = {
    defineNuxtPlugin: (setup: Setup) => {
      nuxt.setups.push(setup);
    },
    useHead: (head: Head) => {
      nuxt.heads.push(head);
    },
    useRequestHeaders: () => {
      return nuxt.request;
    },
    useState: <T>(_key: string, init: () => T) => {
      const value = init();

      return ref(value);
    },
  };

  return nuxtApp;
});

const last = languages.at(-1)?.id ?? 'en';

const install = (ssrContext?: object): App['use'] => {
  const vueApp = createApp({});
  const use = vi.spyOn(vueApp, 'use');

  nuxt.setups[0]?.({
    vueApp,
    ssrContext,
  });

  return use;
};

const headLanguage = (): string | undefined => {
  return nuxt.heads.at(-1)?.htmlAttrs.lang.value;
};

const SERVER = {};

describe('the i18n plugin', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
    delete nuxt.request.cookie;
    delete nuxt.request['accept-language'];
    applyLanguage('en');
    vi.restoreAllMocks();
  });

  it('installs the one i18n in the stored language on the client', () => {
    document.cookie = languageCookie(last);

    const use = install();

    expect(use).toHaveBeenCalledWith(i18n);
    expect(i18n.global.locale.value).toBe(last);
  });

  it('follows the browser on the client when nothing is stored, and stores nothing', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([last]);
    install();

    expect(i18n.global.locale.value).toBe(last);
    expect(document.cookie).toBe('');
  });

  it('renders the stored language on the server, through an i18n of its own', () => {
    nuxt.request.cookie = `theme=dark; ${languageCookie(last)}`;
    nuxt.request['accept-language'] = 'en';

    const use = install(SERVER);

    expect(use).not.toHaveBeenCalledWith(i18n);
    const language = headLanguage();
    expect(language).toBe(last);
    expect(i18n.global.locale.value).toBe('en');
  });

  it('follows Accept-Language on the server when nothing is stored', () => {
    nuxt.request['accept-language'] = `fr;q=0.9, ${last}`;
    install(SERVER);

    const language = headLanguage();
    expect(language).toBe(last);
  });

  it('renders English on the server for a request that names nothing', () => {
    install(SERVER);

    const language = headLanguage();
    expect(language).toBe('en');
  });

  it.each(languages)('keeps the head lang and dir on $id', ({ id, dir }) => {
    install();
    applyLanguage(id);

    const htmlAttrs = nuxt.heads.at(-1)?.htmlAttrs;

    expect(htmlAttrs?.lang.value).toBe(id);
    expect(htmlAttrs?.dir.value).toBe(dir);
  });
});
