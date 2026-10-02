import { ruleIdsFor, sortsAheadOfPackages } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { reactGroup } from '../../../frameworks/react/reactFramework';
import base from '../baseLayer';

import { buildGroups } from './importSortUtils';

import type { AliasMap } from '../../../types';

const ALIASES: AliasMap = {
  '@components/*': './src/components/*',
  '@ui/*': './src/components/ui/*',
  '@lib/*': './src/lib/*',
  '@hooks/*': './src/lib/hooks/*',
  '@config/*': './src/config/*',
  '@mocks/*': './__mocks__/*',
};

const indexOfPattern = (groups: string[][], pattern: string): number => {
  return groups
    .findIndex((group) => {
      return group.includes(pattern);
    });
};

describe('buildGroups', () => {
  it('omits the framework and alias buckets when neither is supplied', () => {
    const groups = buildGroups();

    const expected = [
      [
        '^node:',
        '^fs$',
        '^path$',
      ],
      [String.raw`^@?\w`],
      [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`],
      [String.raw`^\./`],
      [String.raw`^(?!.*[.](?:css|json)$)[^.].*\u0000$`, String.raw`^[.].*\u0000$`],
      [String.raw`^.+\.s?css$`],
    ];
    expect(groups).toEqual(expected);
  });

  it('places the framework bucket second, directly after the built-ins', () => {
    const groups = buildGroups(ALIASES, reactGroup);

    expect(groups[1]).toBe(reactGroup);
    expect(groups[1]).toContain('^react$');
  });

  it('orders the alias buckets down the dependency direction', () => {
    const groups = buildGroups(ALIASES, reactGroup);

    const actual = indexOfPattern(groups, '^@config(?:/|$)');
    expect(actual).toBeLessThan(indexOfPattern(groups, '^@lib(?:/|$)'));
    const actual2 = indexOfPattern(groups, '^@lib(?:/|$)');
    expect(actual2).toBeLessThan(indexOfPattern(groups, '^@hooks(?:/|$)'));
    const actual3 = indexOfPattern(groups, '^@hooks(?:/|$)');
    expect(actual3).toBeLessThan(indexOfPattern(groups, '^@ui(?:/|$)'));
    const actual4 = indexOfPattern(groups, '^@ui(?:/|$)');
    expect(actual4).toBeLessThan(indexOfPattern(groups, '^@mocks(?:/|$)'));
  });

  it('emits no pattern for an alias the project does not declare', () => {
    const groups = buildGroups(ALIASES).flat();

    expect(groups).not.toContain('^@apis(?:/|$)');
    expect(groups).not.toContain('^@store(?:/|$)');
  });

  it('shares the components bucket between @ui and @components', () => {
    const groups = buildGroups(ALIASES);

    const expected = ['^@ui(?:/|$)', '^@components(?:/|$)'];
    expect(groups[indexOfPattern(groups, '^@ui(?:/|$)')]).toEqual(expected);
  });

  it('gives an alias no bucket names its own group rather than losing it to node_modules', () => {
    const groups = buildGroups({ '@/*': './src/*' });

    const actual = indexOfPattern(groups, '^@(?:/|$)');
    expect(actual).toBeGreaterThan(indexOfPattern(groups, String.raw`^@?\w`));
  });

  it('sorts the unnamed aliases so the group is stable between runs', () => {
    const groups = buildGroups({
      '@widgets/*': './src/widgets/*',
      '@assets/*': './src/assets/*',
    });

    const expected = ['^@assets(?:/|$)', '^@widgets(?:/|$)'];
    expect(groups[indexOfPattern(groups, '^@assets(?:/|$)')]).toEqual(expected);
  });

  it('matches a bare alias as well as a deep one', () => {
    const groups = buildGroups({
      '@engine': './src/engine',
      '@utils/*': './src/utils/*',
    });
    const engine = new RegExp(groups
      .flat()
      .find((pattern) => {
        return pattern.startsWith('^@engine');
      }) ?? '');

    const actual = indexOfPattern(groups, '^@engine(?:/|$)');
    expect(actual).toBeGreaterThan(-1);
    const actual2 = engine.exec('@engine');
    expect(actual2).not.toBeNull();
    const actual3 = engine.exec('@engine/parse');
    expect(actual3).not.toBeNull();
    const actual4 = engine.exec('@engineering/toolkit');
    expect(actual4).toBeNull();
  });

  it('matches a bare alias in a named bucket too', () => {
    const utils = new RegExp(
      buildGroups({ '@utils': './src/utils' })
        .flat()
        .find((pattern) => {
          return pattern.startsWith('^@utils');
        }) ?? '',
    );

    const actual = utils.exec('@utils');
    expect(actual).not.toBeNull();
    const actual2 = utils.exec('@utils/format');
    expect(actual2).not.toBeNull();
  });

  it('escapes an alias whose name is regex syntax', () => {
    const patterns = buildGroups({
      '$lib': './src/lib',
      '$lib/*': './src/lib/*',
    }).flat();

    expect(patterns).toContain(String.raw`^\$lib(?:/|$)`);
    expect(patterns).not.toContain('^$lib(?:/|$)');
    const actual = '$lib/store/user'.startsWith('$lib/');
    expect(actual).toBe(true);
    const actual2 = new RegExp(String.raw`^\$lib(?:/|$)`).exec('$lib/store/user');
    expect(actual2).not.toBeNull();
    const actual3 = new RegExp('^$lib(?:/|$)').exec('$lib/store/user');
    expect(actual3).toBeNull();
  });

  it('files every named alias in its bucket and nowhere else', () => {
    const named = [
      '@config',
      '@typings',
      '@styles',
      '@lib',
      '@store',
      '@services',
      '@providers',
      '@apis',
      '@utils',
      '@i18n',
      '@hooks',
      '@composables',
      '@primitives',
      '@ui',
      '@features',
      '@components',
      '@mocks',
    ];
    const aliases = Object.fromEntries([...named, '@widgets']
      .map((name) => {
        return [`${name}/*`, `./src/${name.slice(1)}/*`];
      }));

    const pattern = (name: string): string => {
      return `^${name}(?:/|$)`;
    };

    const sliced = buildGroups(aliases).slice(2, -4);
    const expected = [
      [
        '@config',
        '@typings',
        '@styles',
      ].map(pattern),
      [
        '@lib',
        '@store',
        '@services',
        '@providers',
        '@apis',
        '@utils',
        '@i18n',
      ].map(pattern),
      [
        '@hooks',
        '@composables',
        '@primitives',
      ].map(pattern),
      [
        '@ui',
        '@features',
        '@components',
      ].map(pattern),
      ['@mocks'].map(pattern),
      ['@widgets'].map(pattern),
    ];
    expect(sliced).toEqual(expected);
  });

  it('adds no framework bucket for an empty framework group', () => {
    const groups = buildGroups({}, []);
    expect(groups).toEqual(buildGroups());
  });

  it('matches an alias whose wildcard sits mid-key', () => {
    const patterns = buildGroups({
      '@features/*/api': './src/features/*/api',
      '@app/shared/*': './src/app/shared/*',
    }).flat();

    expect(patterns).toContain('^@features(?:/|$)');
    expect(patterns).toContain('^@app/shared(?:/|$)');
  });

  it('keeps the styles bucket last', () => {
    const groups = buildGroups(ALIASES, reactGroup);

    const actual = groups.at(-1);
    const expected = [String.raw`^.+\.s?css$`];
    expect(actual).toEqual(expected);
  });
});

describe('base: simple-import-sort', () => {
  it('reports a misordered import block', async () => {
    const code = [
      "import { helper } from './helper';",
      "import { readFile } from 'node:fs/promises';",
      '',
      'export const value = helper(readFile);',
      '',
    ].join('\n');

    const ruleIds = await ruleIdsFor(base(), code, 'src/lib/utils/sample.ts');
    expect(ruleIds).toContain('simple-import-sort/imports');
  });

  it('sorts a framework import with the packages when no framework group is given', async () => {
    const actual = await sortsAheadOfPackages(base(), 'react');
    expect(actual).toBe(false);
  });
});
