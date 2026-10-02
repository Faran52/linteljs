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

    const configIndex = indexOfPattern(groups, '^@config(?:/|$)');
    const libIndex = indexOfPattern(groups, '^@lib(?:/|$)');
    const hooksIndex = indexOfPattern(groups, '^@hooks(?:/|$)');
    const uiIndex = indexOfPattern(groups, '^@ui(?:/|$)');
    const mocksIndex = indexOfPattern(groups, '^@mocks(?:/|$)');

    expect(configIndex).toBeLessThan(libIndex);
    expect(libIndex).toBeLessThan(hooksIndex);
    expect(hooksIndex).toBeLessThan(uiIndex);
    expect(uiIndex).toBeLessThan(mocksIndex);
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
    const aliases = { '@/*': './src/*' } as const;
    const groups = buildGroups(aliases);

    const actual = indexOfPattern(groups, '^@(?:/|$)');
    expect(actual).toBeGreaterThan(indexOfPattern(groups, String.raw`^@?\w`));
  });

  it('sorts the unnamed aliases so the group is stable between runs', () => {
    const aliases = {
      '@widgets/*': './src/widgets/*',
      '@assets/*': './src/assets/*',
    } as const;
    const groups = buildGroups(aliases);

    const expected = ['^@assets(?:/|$)', '^@widgets(?:/|$)'];
    expect(groups[indexOfPattern(groups, '^@assets(?:/|$)')]).toEqual(expected);
  });

  it('matches a bare alias as well as a deep one', () => {
    const aliases = {
      '@engine': './src/engine',
      '@utils/*': './src/utils/*',
    } as const;
    const groups = buildGroups(aliases);
    const engine = new RegExp(groups
      .flat()
      .find((pattern) => {
        return pattern.startsWith('^@engine');
      }) ?? '');

    const engineIndex = indexOfPattern(groups, '^@engine(?:/|$)');
    expect(engineIndex).toBeGreaterThan(-1);
    const bareMatch = engine.exec('@engine');
    expect(bareMatch).not.toBeNull();
    const subpathMatch = engine.exec('@engine/parse');
    expect(subpathMatch).not.toBeNull();
    const siblingMatch = engine.exec('@engineering/toolkit');
    expect(siblingMatch).toBeNull();
  });

  it('matches a bare alias in a named bucket too', () => {
    const aliases = { '@utils': './src/utils' } as const;
    const utils = new RegExp(
      buildGroups(aliases)
        .flat()
        .find((pattern) => {
          return pattern.startsWith('^@utils');
        }) ?? '',
    );

    const bareMatch = utils.exec('@utils');
    expect(bareMatch).not.toBeNull();
    const subpathMatch = utils.exec('@utils/format');
    expect(subpathMatch).not.toBeNull();
  });

  it('escapes an alias whose name is regex syntax', () => {
    const aliases = {
      '$lib': './src/lib',
      '$lib/*': './src/lib/*',
    } as const;
    const patterns = buildGroups(aliases).flat();

    expect(patterns).toContain(String.raw`^\$lib(?:/|$)`);
    expect(patterns).not.toContain('^$lib(?:/|$)');
    const startsWithLib = '$lib/store/user'.startsWith('$lib/');
    expect(startsWithLib).toBe(true);
    const escapedMatch = new RegExp(String.raw`^\$lib(?:/|$)`).exec('$lib/store/user');
    expect(escapedMatch).not.toBeNull();
    const rawMatch = new RegExp('^$lib(?:/|$)').exec('$lib/store/user');
    expect(rawMatch).toBeNull();
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
    const mapList = [...named, '@widgets'];
    const aliases = Object.fromEntries(mapList
      .map((name) => {
        const aliasEntry = [`${name}/*`, `./src/${name.slice(1)}/*`] as const;
        return aliasEntry;
      }));

    const pattern = (name: string): string => {
      return `^${name}(?:/|$)`;
    };

    const sliced = buildGroups(aliases).slice(2, -4);
    const dataNames = [
      '@config',
      '@typings',
      '@styles',
    ];
    const logicNames = [
      '@lib',
      '@store',
      '@services',
      '@providers',
      '@apis',
      '@utils',
      '@i18n',
    ];
    const behaviorNames = [
      '@hooks',
      '@composables',
      '@primitives',
    ];
    const viewNames = [
      '@ui',
      '@features',
      '@components',
    ];
    const mocksNames = ['@mocks'];
    const widgetsNames = ['@widgets'];
    const expected = [
      dataNames.map(pattern),
      logicNames.map(pattern),
      behaviorNames.map(pattern),
      viewNames.map(pattern),
      mocksNames.map(pattern),
      widgetsNames.map(pattern),
    ];
    expect(sliced).toEqual(expected);
  });

  it('adds no framework bucket for an empty framework group', () => {
    const groups = buildGroups({}, []);
    expect(groups).toEqual(buildGroups());
  });

  it('matches an alias whose wildcard sits mid-key', () => {
    const aliases = {
      '@features/*/api': './src/features/*/api',
      '@app/shared/*': './src/app/shared/*',
    } as const;
    const patterns = buildGroups(aliases).flat();

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
    const joinList = [
      "import { helper } from './helper';",
      "import { readFile } from 'node:fs/promises';",
      '',
      'export const value = helper(readFile);',
      '',
    ];
    const code = joinList.join('\n');

    const ruleIds = await ruleIdsFor(base(), code, 'src/lib/utils/sample.ts');
    expect(ruleIds).toContain('simple-import-sort/imports');
  });

  it('sorts a framework import with the packages when no framework group is given', async () => {
    const actual = await sortsAheadOfPackages(base(), 'react');
    expect(actual).toBe(false);
  });
});
