import { answersFor } from '@mocks/answersFor';
import { pickedBy } from '@mocks/starterGates';

import { hasForm } from './gateUtils';
import {
  i18nFiles,
  languageUtilsFile,
  languageUtilsTest,
  localeFiles,
  LOCALES_TEST,
  translated,
} from './i18nUtils';

import type { StarterFile } from '../types';

const ENGLISH = answersFor({});
const ARABIC = answersFor({ languages: ['ar'] });

const whenOf = (file: StarterFile | undefined): ((answers: typeof ENGLISH) => boolean) => {
  return file?.when ?? (() => {
    return false;
  });
};

describe('translated', () => {
  it('pairs a file with an i18n twin, each written on its own side', () => {
    const [base, twin] = translated<StarterFile>({ target: 'src/a.ts' });

    expect(twin?.variant).toBe('i18n');
    const actual = [whenOf(base)(ENGLISH), whenOf(twin)(ENGLISH)];
    const expected = [true, false];
    expect(actual).toEqual(expected);
    const inArabic = [whenOf(base)(ARABIC), whenOf(twin)(ARABIC)];
    const twinOnly = [false, true];
    expect(inArabic).toEqual(twinOnly);
  });

  it('keeps the file\'s own condition on both sides, and suffixes its variant', () => {
    const [base, twin] = translated<StarterFile>({
      target: 'src/a.ts',
      when: (answers) => {
        return answers.form !== undefined;
      },
      variant: 'with-form',
    });
    const formless = answersFor({ languages: ['ar'] });

    expect(twin?.variant).toBe('with-form-i18n');
    const actual = [whenOf(base)(formless), whenOf(twin)(formless)];
    const expected = [false, false];
    expect(actual).toEqual(expected);
  });
});

describe('i18nFiles', () => {
  const files = (): StarterFile[] => {
    return i18nFiles({
      translated: ['src/App.tsx'],
      pairs: [
        {
          target: 'src/Contact.tsx',
          when: (answers) => {
            return answers.form !== undefined;
          },
        },
      ],
      only: ['src/i18n/i18n.ts'],
    });
  };

  it('writes the shared configs, the target\'s own files and its pairs without i18n', () => {
    const actual = pickedBy(files(), { form: 'tanstack-form' });

    const expected = [
      'src/config/statuses.ts base',
      'src/config/standard.ts base',
      'src/App.tsx base',
      'src/Contact.tsx base',
    ];
    expect(actual).toEqual(expected);
  });

  it('swaps each for its twin and adds the i18n-only files with i18n', () => {
    const actual = pickedBy(files(), {
      form: 'tanstack-form',
      languages: ['ar'],
    });

    const expected = [
      'src/config/statuses.ts i18n',
      'src/config/standard.ts i18n',
      'src/App.tsx i18n',
      'src/Contact.tsx i18n',
      'src/i18n/i18n.ts i18n',
    ];
    expect(actual).toEqual(expected);
  });

  it('keeps a pair\'s own condition', () => {
    const actual = pickedBy(files(), { languages: ['ar'] });

    const expected = [
      'src/config/statuses.ts i18n',
      'src/config/standard.ts i18n',
      'src/App.tsx i18n',
      'src/i18n/i18n.ts i18n',
    ];
    expect(actual).toEqual(expected);
  });

  it('reads the configs from the shared tree and the rest from the target', () => {
    const shared = files()
      .map(({ shared: tree }) => {
        return tree;
      });

    const expected = [
      true,
      true,
      true,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ];
    expect(shared).toEqual(expected);
  });

  it('writes no pairs when given none', () => {
    const actual = i18nFiles({
      translated: [],
      only: [],
    });

    expect(actual).toHaveLength(4);
  });
});

describe('localeFiles', () => {
  it('writes English and each chosen locale, and no other', () => {
    const japanese = answersFor({ languages: ['ja'] });
    const written = localeFiles(hasForm)
      .filter((file) => {
        return whenOf(file)(japanese);
      })
      .map(({ target }) => {
        return target;
      });

    const expected = ['src/i18n/locales/en/common.json', 'src/i18n/locales/ja/common.json'];
    expect(written).toEqual(expected);
  });

  it('reads each from the shared i18n tree', () => {
    const [english] = localeFiles(hasForm);

    const expected = {
      variant: 'i18n',
      shared: true,
    };
    expect(english).toMatchObject(expected);
  });

  it('keeps a locale whole where the project has a contact page', () => {
    const [english] = localeFiles(() => {
      return true;
    });
    const source = '{\n  "contact": "Contact",\n  "home": "Home"\n}\n';

    const written = english?.transform?.(source, ARABIC);

    expect(written).toBe(source);
  });

  it('drops each msw twin where nothing mocks the form', () => {
    const [english] = localeFiles(hasForm);
    const source = '{\n  "contactSent": "Thanks.",\n  "contactSentMsw": "Sent.",\n  "home": "Home"\n}\n';

    const written = english?.transform?.(source, answersFor({ form: 'tanstack-form' }));

    const expected = '{\n  "contactSent": "Thanks.",\n  "home": "Home"\n}\n';
    expect(written).toBe(expected);
  });

  it('drops only a top-level msw twin', () => {
    const [english] = localeFiles(hasForm);
    const source = '{\n  "form": {\n    "sentMsw": "Sent."\n  }\n}\n';

    const written = english?.transform?.(source, answersFor({ form: 'tanstack-form' }));

    expect(written).toBe(source);
  });

  it('puts each msw twin in its key\'s place under msw', () => {
    const [english] = localeFiles(hasForm);
    const source = '{\n  "contactSent": "Thanks.",\n  "contactSentMsw": "Sent.",\n  "home": "Home"\n}\n';

    const written = english?.transform?.(source, answersFor({
      form: 'tanstack-form',
      mocking: 'msw',
    }));

    const expected = '{\n  "contactSent": "Sent.",\n  "home": "Home"\n}\n';
    expect(written).toBe(expected);
  });

  it('drops every contact key, and only those, where the project has no contact page', () => {
    const [english] = localeFiles();
    const source = '{\n  "contact": "Contact",\n  "home": "Home",\n  "contactSend": "Send"\n}\n';

    const written = english?.transform?.(source, ARABIC);

    const expected = '{\n  "home": "Home"\n}\n';
    expect(written).toBe(expected);
  });

  it.each([
    '[]',
    '{ "count": 1 }',
    '{ "home": "Home", "count": 1 }',
    'not json',
  ])('leaves a locale it cannot read, %s, as written', (source) => {
    const [english] = localeFiles();

    const written = english?.transform?.(source, ARABIC);

    expect(written).toBe(source);
  });
});

describe('LOCALES_TEST', () => {
  it('runs only in a translated project', () => {
    const actual = LOCALES_TEST.when?.(ENGLISH);
    expect(actual).toBe(false);
    const inArabic = LOCALES_TEST.when?.(ARABIC);
    expect(inArabic).toBe(true);
  });
});

describe('languageUtilsFile', () => {
  it('writes the shared helpers under the default name, only in a translated project', () => {
    const file = languageUtilsFile();
    const expected = {
      target: 'src/i18n/utils/languageUtils.ts',
      source: 'src/i18n/utils/languageUtils.ts',
      variant: 'i18n',
      shared: true,
    };
    expect(file).toMatchObject(expected);
    const inEnglish = file.when?.(ENGLISH);
    expect(inEnglish).toBe(false);
  });

  it('writes them under the name a target gives', () => {
    const { target } = languageUtilsFile('language-utils');

    expect(target).toBe('src/i18n/utils/language-utils.ts');
  });
});

describe('languageUtilsTest', () => {
  it('covers the helpers under the default name and suffix', () => {
    const test = languageUtilsTest();
    const expected = {
      target: 'src/i18n/utils/languageUtils.test.ts',
      covers: 'src/i18n/utils/languageUtils.ts',
      source: 'src/i18n/utils/languageUtils.test.ts',
    };
    expect(test).toMatchObject(expected);
    const inArabic = test.when?.(ARABIC);
    expect(inArabic).toBe(true);
  });

  it('covers them under the name and suffix a target gives', () => {
    const { target, covers } = languageUtilsTest('language-utils', 'spec');

    expect(target).toBe('src/i18n/utils/language-utils.spec.ts');
    expect(covers).toBe('src/i18n/utils/language-utils.ts');
  });
});
