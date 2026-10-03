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

import { angularTarget } from './angularTarget';
import { SHARED, TRANSLATED } from './constants';

describe('angularTarget', () => {
  it('is the record the angular answer names', () => {
    expect(angularTarget.id).toBe('angular');
  });

  it('has its project file written rather than copied', () => {
    expect(angularTarget.angularProject).toBe(true);
    expect(angularTarget.build).toBe('ng build');
  });

  it('imports every stylesheet it ships from the style entry, in the order they cascade', () => {
    const shipped = SHARED
      .filter((path) => {
        return path.endsWith('.css');
      })
      .map((path) => {
        return path.replace('src/', './');
      });

    expect(angularTarget.starterStyles).toEqual(shipped);
  });

  it('ships the route table with Contact in it, since the Contact page always ships', () => {
    const routes = angularTarget.starterFiles
      .find((file) => {
        return file.target === 'src/config/routes.ts';
      });

    expect(routes?.variant).toBe('with-form');
  });

  it('writes the shared ForbiddenError suite under the kebab spec name the CLI would give it', () => {
    const suite = angularTarget.starterTests
      .find((test) => {
        return test.covers === 'src/lib/utils/status-utils.ts';
      });

    expect(suite?.target).toBe('src/lib/utils/status-utils.spec.ts');
  });

  it('translates through a signal of its own, with no library, compiler or test setup', () => {
    const expected = { dependencies: [] };
    expect(angularTarget.i18n).toEqual(expected);
  });

  it('names every module the way the CLI would, and leaves declarations to their own key', () => {
    expect(angularTarget.naming['src/**/!(*.d).ts']).toBe('KEBAB_CASE');
    expect(angularTarget.naming).not.toHaveProperty('src/**/*.ts');
    expect(angularTarget.naming['src/**/*.d.ts']).toBeDefined();
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
  'src/components/ui/code-text/code-text.ts',
  'src/components/ui/code-text/code-text.html',
  'src/components/ui/code-text/code-text.spec.ts',
  'src/components/features/app-header/app-header.spec.ts',
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
  ['src/lib/services/extended-query/extended-query.spec.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/services/extended-mutation/extended-mutation.spec.ts@tanstack-query', TANSTACK_QUERY],
];

describe('the starter gates', () => {
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(() => {
      return angularTarget;
    }, 'angular');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(() => {
      return angularTarget;
    }, 'angular');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(() => {
      return angularTarget;
    }, 'angular');
    const mismatches = walk.mismatchesOf(GATES);
    expect(mismatches).toEqual([]);
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const favicon = angularTarget.starterFiles.find((file) => {
      return file.target === 'public/favicon.svg';
    });

    const expected = {
      target: 'public/favicon.svg',
      shared: true,
    };
    expect(favicon).toEqual(expected);
  });
});
