import {
  type App,
  createApp,
  type Ref,
  ref,
} from 'vue';
import { useNuxtApp } from 'nuxt/app';

import { mockNuxtImport } from '@nuxt/test-utils/runtime';

import { languages, languageStorageKey } from '@i18n/config';
import {
  applyLanguage,
  i18n,
} from '@i18n/i18n';
import { languageCookie } from '@i18n/utils/cookieUtils';

import plugin from './i18n';

interface Head {
  htmlAttrs: Record<'lang' | 'dir', Readonly<Ref<string>>>;
}

// Captures the heads the plugin hands Nuxt and serves the request it reads.
const nuxt = vi.hoisted(() => {
  const heads: Head[] = [];
  const request: Record<string, string> = {};

  const captured = {
    heads,
    request,
  };

  return captured;
});

mockNuxtImport('useHead', () => {
  return (head: Head) => {
    nuxt.heads.push(head);
  };
});

mockNuxtImport('useRequestHeaders', () => {
  return () => {
    return nuxt.request;
  };
});

// Fresh on each install: Nuxt's own keeps the first value for the whole run.
mockNuxtImport('useState', () => {
  return <T>(_key: string, init: () => T) => {
    const value = init();

    return ref(value);
  };
});

const last = languages.at(-1)?.id ?? 'en';

// Run against a fresh app in each case; any `ssrContext` marks the render as the server's.
const install = async (ssrContext?: object): Promise<App['use']> => {
  const vueApp = createApp({});
  const use = vi.spyOn(vueApp, 'use');
  const nuxtApp = {
    ...useNuxtApp(),
    vueApp,
  };

  Reflect.set(nuxtApp, 'ssrContext', ssrContext);
  await plugin(nuxtApp);

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

  it('installs the one i18n in the stored language on the client', async () => {
    document.cookie = languageCookie(last);

    const use = await install();

    expect(use).toHaveBeenCalledWith(i18n);
    expect(i18n.global.locale.value).toBe(last);
  });

  it('follows the browser on the client when nothing is stored, and stores nothing', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([last]);
    await install();

    expect(i18n.global.locale.value).toBe(last);
    expect(document.cookie).toBe('');
  });

  it('renders the stored language on the server, through an i18n of its own', async () => {
    nuxt.request.cookie = `theme=dark; ${languageCookie(last)}`;
    nuxt.request['accept-language'] = 'en';

    const use = await install(SERVER);

    expect(use).not.toHaveBeenCalledWith(i18n);
    const language = headLanguage();
    expect(language).toBe(last);
    expect(i18n.global.locale.value).toBe('en');
  });

  it('follows Accept-Language on the server when nothing is stored', async () => {
    nuxt.request['accept-language'] = `fr;q=0.9, ${last}`;
    await install(SERVER);

    const language = headLanguage();
    expect(language).toBe(last);
  });

  it('renders English on the server for a request that names nothing', async () => {
    await install(SERVER);

    const language = headLanguage();
    expect(language).toBe('en');
  });

  it.each(languages)('keeps the head lang and dir on $id', async ({ id, dir }) => {
    await install();
    applyLanguage(id);

    const htmlAttrs = nuxt.heads.at(-1)?.htmlAttrs;

    expect(htmlAttrs?.lang.value).toBe(id);
    expect(htmlAttrs?.dir.value).toBe(dir);
  });
});
