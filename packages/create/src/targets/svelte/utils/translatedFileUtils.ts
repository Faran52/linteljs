import { TRANSLATED_CONFIGS } from '../../constants';
import { hasForm, hasI18n } from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import {
  I18N_ONLY,
  I18N_ONLY_SUITES,
  TRANSLATED,
} from '../constants';

import type { StarterFile, StarterTest } from '../../types';

const I18N_ONLY_FILES = [
  ...I18N_ONLY
    .map((component) => {
      return `${component}.svelte`;
    }),
  'src/i18n/index.ts',
  'src/hooks.server.ts',
  'src/routes/+layout.server.ts',
];

// Each translated suite and the component it covers.
const TRANSLATED_SUITES = [
  ['src/routes/layout.test.ts', 'src/routes/+layout.svelte'],
  ['src/routes/error.test.ts', 'src/routes/+error.svelte'],
  [
    'src/components/features/status-page/StatusPage.test.ts',
    'src/components/features/status-page/StatusPage.svelte',
  ],
] as const;

// What i18n rewrites in the Svelte starter, each as the pair `translated` makes.
export const svelteI18nFiles = (): StarterFile[] => {
  const files: StarterFile[] = [
    ...TRANSLATED_CONFIGS
      .flatMap((target) => {
        return translated<StarterFile>({
          target,
          shared: true,
        });
      }),
    ...TRANSLATED
      .flatMap((target) => {
        return translated<StarterFile>({ target });
      }),
    ...translated<StarterFile>({
      target: 'src/routes/contact/+page.svelte',
      when: hasForm,
    }),
    ...I18N_ONLY_FILES
      .map((target): StarterFile => {
        const file: StarterFile = {
          target,
          when: hasI18n,
          variant: 'i18n',
        };

        return file;
      }),
  ];

  return files;
};

// The layout mounts the header, so its twin proves the language is detected once mounted.
export const svelteI18nTests = (): StarterTest[] => {
  const tests: StarterTest[] = [
    ...TRANSLATED_SUITES
      .flatMap(([target, covers]) => {
        return translated<StarterTest>({
          target,
          covers,
        });
      }),
    ...I18N_ONLY
      .map((component): StarterTest => {
        const test: StarterTest = {
          target: `${component}.test.ts`,
          covers: `${component}.svelte`,
          when: hasI18n,
          variant: 'i18n',
        };

        return test;
      }),
    ...I18N_ONLY_SUITES
      .map(([target, covers]): StarterTest => {
        const test: StarterTest = {
          target,
          covers,
          when: hasI18n,
          variant: 'i18n',
        };

        return test;
      }),
  ];

  return tests;
};
