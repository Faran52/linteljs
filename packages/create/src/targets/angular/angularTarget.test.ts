import {
  ANSWERED,
  byKey,
  type GateRow,
  mswGates,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITH_I18N,
  WITHOUT_I18N,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { LANGUAGES } from '@config/constants';

import { DEFAULT_ANSWERS } from '@answers';

import { angularTarget } from './angularTarget';
import { SHARED, TRANSLATED } from './constants';

const recordFor = (): ReturnType<typeof angularTarget> => {
  return angularTarget({
    ...DEFAULT_ANSWERS,
    target: 'angular',
  });
};

describe('angularTarget', () => {
  it('is the record the angular answer names', () => {
    const record = recordFor();
    expect(record.id).toBe('angular');
  });

  it('has its project file written rather than copied', () => {
    const record = recordFor();
    expect(record.angularProject).toBe(true);
    expect(record.build).toBe('ng build');
  });

  it('imports every stylesheet it ships from the style entry, in the order they cascade', () => {
    const record = recordFor();
    const shipped = SHARED
      .filter((path) => {
        return path.endsWith('.css');
      })
      .map((path) => {
        return path.replace('src/', './');
      });

    expect(record.starterStyles).toEqual(shipped);
  });

  it('ships the route table with Contact in it, since the Contact page always ships', () => {
    const record = recordFor();
    const routes = record.starterFiles
      .find((file) => {
        return file.target === 'src/config/routes.ts';
      });

    expect(routes?.variant).toBe('with-form');
  });

  it('writes the shared ForbiddenError suite under the kebab spec name the CLI would give it', () => {
    const record = recordFor();
    const suite = record.starterTests
      .find((test) => {
        return test.covers === 'src/lib/utils/status-utils.ts';
      });

    expect(suite?.target).toBe('src/lib/utils/status-utils.spec.ts');
  });

  it('points each camelCase alias at a kebab file it writes', () => {
    const record = recordFor();
    const written = record.starterFiles
      .map((file) => {
        return `./${file.target}`;
      });
    const aliased = Object.values(record.extraAliases ?? {});

    const unwritten = aliased
      .filter((path) => {
        return !written.includes(path);
      });
    expect(aliased).toHaveLength(2);
    expect(unwritten).toEqual([]);
  });

  it('translates through a signal of its own, with no library, compiler or test setup', () => {
    const record = recordFor();
    const expected = { dependencies: [] };
    expect(record.i18n).toEqual(expected);
  });

  it('names every module the way the CLI would, and leaves declarations to their own key', () => {
    const record = recordFor();
    expect(record.naming['src/**/!(*.d).ts']).toBe('KEBAB_CASE');
    expect(record.naming).not.toHaveProperty('src/**/*.ts');
    expect(record.naming['src/**/*.d.ts']).toBeDefined();
  });
});

const CONTACT_PATHS = ['src/app/contact/contact.ts', 'src/app/contact/contact.html'] as const;

const BILINGUAL_PATHS = [
  'src/config/statuses.ts',
  'src/config/standard.ts',
  ...TRANSLATED,
  'src/app/contact/contact.spec.ts',
  'src/components/features/status-page/status-page.spec.ts',
];

const I18N_ONLY_PATHS = [
  'src/i18n/index.ts',
  'src/i18n/index.spec.ts',
  'src/i18n/locales.test.ts',
  'src/i18n/utils/language-utils.ts',
  'src/i18n/utils/language-utils.spec.ts',
  'src/components/ui/code-text/code-text.ts',
  'src/components/ui/code-text/code-text.html',
  'src/components/ui/code-text/code-text.spec.ts',
  'src/components/features/app-header/app-header.spec.ts',
  'src/app/home/home.spec.ts',
  'src/app/about/about.spec.ts',
  'src/app/version/version.spec.ts',
  ...LANGUAGES
    .map((language) => {
      return `src/i18n/locales/${language}/common.json`;
    }),
];

const GATES: GateRow[] = [
  ...mswGates(false),
  ['src/lib/services/extended-query/extended-query.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/services/extended-mutation/extended-mutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/query-options-utils.ts', TANSTACK_QUERY],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['.postcssrc.json@tailwind', TAILWIND],
  ...CONTACT_PATHS
    .flatMap((key): GateRow[] => {
      const rows: GateRow[] = [
        [key, [{ form: [undefined], languages: [undefined] }]],
        [`${key}@i18n`, [{ form: [undefined], languages: ANSWERED }]],
        [`${key}@tanstack-form`, [{ form: ['tanstack-form'], languages: [undefined] }]],
        [`${key}@tanstack-form-i18n`, [{ form: ['tanstack-form'], languages: ANSWERED }]],
      ];

      return rows;
    }),
  ...BILINGUAL_PATHS
    .flatMap((key): GateRow[] => {
      const rows: GateRow[] = [[key, WITHOUT_I18N], [`${key}@i18n`, WITH_I18N]];

      return rows;
    }),
  ...I18N_ONLY_PATHS
    .map((key): GateRow => {
      const row: GateRow = [`${key}@i18n`, WITH_I18N];

      return row;
    }),
  ['src/lib/apis/contact/schemas.ts', [{ libraries: [[]] }]],
  ['src/lib/apis/contact/schemas.ts@zod', [{ libraries: [['zod']] }]],
  ['src/lib/apis/contact/form-validator.ts', [{ form: ['tanstack-form'] }]],
  ['src/lib/services/extended-query/extended-query.spec.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/services/extended-mutation/extended-mutation.spec.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/utils/query-options-utils.spec.ts', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(angularTarget, 'angular');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(angularTarget, 'angular');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(angularTarget, 'angular');
    const mismatches = walk.mismatchesOf(GATES);
    expect(mismatches).toEqual([]);
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const record = recordFor();
    const favicon = record.starterFiles
      .find((file) => {
        return file.target === 'public/favicon.svg';
      });

    const expected = {
      target: 'public/favicon.svg',
      shared: true,
    };
    expect(favicon).toEqual(expected);
  });
});
