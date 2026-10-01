import {
  type Answers,
  type Artifact,
  type Language,
} from '@config/types';

import { localesOf } from '@utils/answerUtils';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

import { LANGUAGE_NAMES, LOOKUP_TAGS } from './constants';

export const I18N_CONFIG = 'src/i18n/config.ts';
export const INLANG_SETTINGS = 'project.inlang/settings.json';

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
    ...LOOKUP_TAGS,
    '',
  ].join('\n');
};

// The compiler's plugin is read from `node_modules`: the documented module is a CDN URL fetched on every compile.
export const emitInlangSettings = (languages: Language[]): string => {
  const settings = {
    '$schema': 'https://inlang.com/schema/project-settings',
    'baseLocale': 'en',
    'locales': languages,
    'modules': ['./node_modules/@inlang/plugin-message-format/dist/index.js'],
    'plugin.inlang.messageFormat': { pathPattern: './src/i18n/locales/{locale}/common.json' },
  };

  return `${JSON.stringify(settings, null, 2)}\n`;
};

export const i18nConfigEmitter = (answers: Answers): Artifact[] => {
  const languages = localesOf(answers);

  if (languages.length === 0) {
    return [];
  }

  const seeded = (path: string, content: string): Artifact => {
    return {
      ...emitted('standard', path, content),
      seed: true,
    };
  };
  const config = seeded(I18N_CONFIG, emitI18nConfig(languages));

  return targetFor(answers).i18n?.compiler === undefined
    ? [config]
    : [config, seeded(INLANG_SETTINGS, emitInlangSettings(languages))];
};
