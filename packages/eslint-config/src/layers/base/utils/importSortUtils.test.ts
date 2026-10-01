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

    expect(groups).toEqual([
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
    ]);
  });

  it('places the framework bucket second, directly after the built-ins', () => {
    const groups = buildGroups(ALIASES, reactGroup);

    expect(groups[1]).toBe(reactGroup);
    expect(groups[1]).toContain('^react$');
  });

  it('orders the alias buckets down the dependency direction', () => {
    const groups = buildGroups(ALIASES, reactGroup);

    expect(indexOfPattern(groups, '^@config(?:/|$)')).toBeLessThan(indexOfPattern(groups, '^@lib(?:/|$)'));
    expect(indexOfPattern(groups, '^@lib(?:/|$)')).toBeLessThan(indexOfPattern(groups, '^@hooks(?:/|$)'));
    expect(indexOfPattern(groups, '^@hooks(?:/|$)')).toBeLessThan(indexOfPattern(groups, '^@ui(?:/|$)'));
    expect(indexOfPattern(groups, '^@ui(?:/|$)')).toBeLessThan(indexOfPattern(groups, '^@mocks(?:/|$)'));
  });

  it('emits no pattern for an alias the project does not declare', () => {
    const groups = buildGroups(ALIASES).flat();

    expect(groups).not.toContain('^@apis(?:/|$)');
    expect(groups).not.toContain('^@store(?:/|$)');
  });

  it('shares the components bucket between @ui and @components', () => {
    const groups = buildGroups(ALIASES);

    expect(groups[indexOfPattern(groups, '^@ui(?:/|$)')]).toEqual(['^@ui(?:/|$)', '^@components(?:/|$)']);
  });

  it('gives an alias no bucket names its own group rather than losing it to node_modules', () => {
    const groups = buildGroups({ '@/*': './src/*' });

    expect(indexOfPattern(groups, '^@(?:/|$)')).toBeGreaterThan(indexOfPattern(groups, String.raw`^@?\w`));
  });

  it('sorts the unnamed aliases so the group is stable between runs', () => {
    const groups = buildGroups({
      '@widgets/*': './src/widgets/*',
      '@assets/*': './src/assets/*',
    });

    expect(groups[indexOfPattern(groups, '^@assets(?:/|$)')]).toEqual(['^@assets(?:/|$)', '^@widgets(?:/|$)']);
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

    expect(indexOfPattern(groups, '^@engine(?:/|$)')).toBeGreaterThan(-1);
    expect(engine.exec('@engine')).not.toBeNull();
    expect(engine.exec('@engine/parse')).not.toBeNull();
    expect(engine.exec('@engineering/toolkit')).toBeNull();
  });

  it('matches a bare alias in a named bucket too', () => {
    const utils = new RegExp(
      buildGroups({ '@utils': './src/utils' })
        .flat()
        .find((pattern) => {
          return pattern.startsWith('^@utils');
        }) ?? '',
    );

    expect(utils.exec('@utils')).not.toBeNull();
    expect(utils.exec('@utils/format')).not.toBeNull();
  });

  it('escapes an alias whose name is regex syntax', () => {
    const patterns = buildGroups({
      '$lib': './src/lib',
      '$lib/*': './src/lib/*',
    }).flat();

    expect(patterns).toContain(String.raw`^\$lib(?:/|$)`);
    expect(patterns).not.toContain('^$lib(?:/|$)');
    expect('$lib/store/user'.startsWith('$lib/')).toBe(true);
    expect(new RegExp(String.raw`^\$lib(?:/|$)`).exec('$lib/store/user')).not.toBeNull();
    expect(new RegExp('^$lib(?:/|$)').exec('$lib/store/user')).toBeNull();
  });

  it('files every named alias in its bucket and nowhere else', () => {
    const named = [
      '@config',
      '@typings',
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

    expect(buildGroups(aliases).slice(2, -4)).toEqual([
      ['@config', '@typings'].map(pattern),
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
    ]);
  });

  it('adds no framework bucket for an empty framework group', () => {
    expect(buildGroups({}, [])).toEqual(buildGroups());
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

    expect(groups.at(-1)).toEqual([String.raw`^.+\.s?css$`]);
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

    await expect(ruleIdsFor(base(), code, 'src/lib/utils/sample.ts'))
      .resolves.toContain('simple-import-sort/imports');
  });

  it('sorts a framework import with the packages when no framework group is given', async () => {
    await expect(sortsAheadOfPackages(base(), 'react')).resolves.toBe(false);
  });
});
