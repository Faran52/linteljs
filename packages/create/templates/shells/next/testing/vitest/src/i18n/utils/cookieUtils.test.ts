import { languageStorageKey } from '../config';

import {
  acceptedTags,
  languageCookie,
  storedLanguage,
} from './cookieUtils';

describe('cookieUtils', () => {
  it('writes a site-wide cookie that outlives the session', () => {
    const cookie = languageCookie('ar');

    expect(cookie).toBe(`${languageStorageKey}=ar; path=/; max-age=31536000; samesite=lax`);
  });

  it('reads the stored language from among other cookies', () => {
    const cookies = `theme=dark; ${languageStorageKey}=ar;other=1`;

    const language = storedLanguage(cookies);
    expect(language).toBe('ar');
  });

  it('reads nothing when no cookie names the language', () => {
    const cookies = `x${languageStorageKey}=ar; theme=dark`;

    const language = storedLanguage(cookies);
    expect(language).toBeUndefined();
  });

  it('orders the accepted tags by weight, dropping the wildcard and the refused', () => {
    const header = 'ja;q=0.5, ar , ko;q=0, *;q=0.1, zh-TW;q=0.8, fr;q=x';

    const tags = acceptedTags(header);

    expect(tags).toEqual([
      'ar',
      'zh-TW',
      'ja',
    ]);
  });

  it('accepts nothing from an empty header', () => {
    const tags = acceptedTags('');

    expect(tags).toEqual([]);
  });
});
