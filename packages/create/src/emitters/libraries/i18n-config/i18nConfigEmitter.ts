import {
  type Answers,
  type Artifact,
  type Language,
} from '@config/types';

import { localesOf } from '@utils/answerUtils';

import { emitted } from '../../utils/artifactUtils';

import { LANGUAGE_NAMES } from './constants';

export const I18N_CONFIG = 'src/i18n/config.ts';

const identifierOf = (language: Language): string => {
  return language
    .replace(/-(\w)(\w)/u, (_match, first: string, second: string) => {
      return `${first}${second.toLowerCase()}`;
    });
};

// Emitted: its imports are the languages chosen. Birth only, like the locales it imports.
export const emitI18nConfig = (languages: Language[]): string => {
  const imports = languages
    .map((language) => {
      return `import ${identifierOf(language)} from './locales/${language}/common.json';`;
    })
    .toSorted((left, right) => {
      return left.localeCompare(right);
    });
  const options = languages
    .map((language) => {
      const { label, dir } = LANGUAGE_NAMES[language];

      return `  {\n    id: '${language}',\n    label: '${label}',\n    dir: '${dir}',\n  },`;
    });
  const resources = languages
    .map((language) => {
      return `  '${language}': { common: ${identifierOf(language)} },`;
    });

  return [
    ...imports,
    '',
    'export const fallbackLanguage = \'en\';',
    '',
    '// Written by the language switcher alone: a detected language is never stored.',
    'export const languageStorageKey = \'language\';',
    '',
    'export const languages = [',
    ...options,
    '] as const;',
    '',
    'export const resources = {',
    ...resources,
    '};',
    '',
  ].join('\n');
};

export const i18nConfigEmitter = (answers: Answers): Artifact[] => {
  const languages = localesOf(answers);

  return languages.length === 0
    ? []
    : [
        {
          ...emitted('standard', I18N_CONFIG, emitI18nConfig(languages)),
          seed: true,
        },
      ];
};
