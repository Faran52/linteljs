import {
  languages,
  lookupTags,
  resources,
} from './config';

type Bundle = Readonly<Record<string, string>>;

const keysOf = (bundle: Bundle): string[] => {
  return Object.keys(bundle)
    .toSorted((left, right) => {
      return left.localeCompare(right);
    });
};

const english: Bundle = resources.en.common;

describe('locales', () => {
  it.each(languages)('$id has every English key and no other', ({ id }) => {
    const bundle: Bundle = resources[id].common;

    expect(keysOf(bundle)).toEqual(keysOf(english));
  });

  it.each(languages)('$id leaves no translation empty', ({ id }) => {
    const bundle: Bundle = resources[id].common;
    const empty = Object.entries(bundle)
      .filter(([, text]) => {
        return text.trim() === '';
      });

    expect(empty).toEqual([]);
  });

  it('looks a tag up by itself, then each shorter prefix', () => {
    const tags = lookupTags('zh-TW-x-hk');

    expect(tags).toEqual([
      'zh-TW-x-hk',
      'zh-TW-x',
      'zh-TW',
      'zh',
    ]);
  });
});
