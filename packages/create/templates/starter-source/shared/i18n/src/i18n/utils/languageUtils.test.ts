import {
  fallbackLanguage,
  languages,
  lookupTags,
} from '../config';

import {
  directionOf,
  formatMessage,
  isLanguage,
  partsOf,
  pickLanguage,
} from './languageUtils';

const last = languages.at(-1)?.id ?? fallbackLanguage;

// A region on a regional tag such as zh-TW makes no tag, so the regional case takes a base one.
const base = languages
  .findLast(({ id }) => {
    return !id.includes('-');
  })?.id ?? fallbackLanguage;

describe('languageUtils', () => {
  it('offers each configured language', () => {
    const offered = languages
      .filter(({ id }) => {
        return isLanguage(id);
      });

    expect(offered).toEqual(languages);
  });

  it.each([
    'fr-FR',
    null,
    undefined,
  ])('does not offer %s', (tag) => {
    const offered = isLanguage(tag);

    expect(offered).toBe(false);
  });

  it('reads each language direction', () => {
    const directions = languages
      .map(({ id }) => {
        return directionOf(id);
      });
    const configured = languages
      .map(({ dir }) => {
        return dir;
      });

    expect(directions).toEqual(configured);
  });

  it('reads left to right for a language it does not offer', () => {
    const direction = directionOf('fr');

    expect(direction).toBe('ltr');
  });

  it('keeps an offered stored choice over the reader languages', () => {
    const language = pickLanguage(last, ['fr', fallbackLanguage]);

    expect(language).toBe(last);
  });

  it('takes the first offered reader language, through its prefixes', () => {
    const language = pickLanguage('xx', [
      'fr-FR',
      `${base}-XX`,
      fallbackLanguage,
    ]);

    expect(language).toBe(base);
  });

  it('reads a Chinese script tag as the region the language codes carry', () => {
    const simplified = lookupTags('zh-Hans-CN');
    const traditional = lookupTags('zh-Hant-HK');

    expect(simplified).toContain('zh-CN');
    expect(traditional).toContain('zh-TW');
  });

  it('falls back when neither the stored choice nor the reader is offered', () => {
    const language = pickLanguage(null, ['fr-FR']);

    expect(language).toBe(fallbackLanguage);
  });

  it('fills the placeholders it has values for and leaves the rest', () => {
    const message = formatMessage('{name} reads {count} of {total}', {
      name: 'Ada',
      count: '2',
    });

    expect(message).toBe('Ada reads 2 of {total}');
  });

  it('leaves every placeholder when given no values', () => {
    const message = formatMessage('{name}');

    expect(message).toBe('{name}');
  });

  it('splits a message around its code spans', () => {
    const parts = partsOf('Run <code>pnpm check</code> first');

    expect(parts).toEqual([
      'Run ',
      'pnpm check',
      ' first',
    ]);
  });
});
