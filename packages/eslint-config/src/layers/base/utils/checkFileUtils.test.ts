import { ruleIdsFor } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import html from '../../html/htmlLayer';
import base from '../baseLayer';

import { buildNaming } from './checkFileUtils';

import type { NamingMap } from '../../../types';

const NAMING: NamingMap = {
  'src/components/**/*.tsx': 'PASCAL_CASE',
  'src/**/*.ts': 'CAMEL_CASE',
};

const FOLDER_NAMING: NamingMap = { 'src/**/': 'KEBAB_CASE' };

const baseOptions = {
  naming: NAMING,
  folderNaming: FOLDER_NAMING,
} as const;
const layer = base(baseOptions);

const SOURCE = 'export const value = 1;\n';

describe('buildNaming', () => {
  it('returns nothing when neither map is supplied', () => {
    const naming = buildNaming();
    expect(naming).toEqual([]);
  });

  it('derives its files glob from the maps rather than restating src', () => {
    const [config] = buildNaming(NAMING, FOLDER_NAMING);

    const expected = [
      'src/components/**/*.tsx',
      'src/**/*.ts',
      'src/**/*',
    ];
    expect(config?.files).toEqual(expected);
  });

  it('omits the folder rule when only filenames are configured', () => {
    const [config] = buildNaming(NAMING);

    expect(config?.rules).toHaveProperty('check-file/filename-naming-convention');
    expect(config?.rules).not.toHaveProperty('check-file/folder-naming-convention');
  });

  it('omits the filename rule when only folders are configured', () => {
    const [config] = buildNaming(undefined, FOLDER_NAMING);

    const expected = ['src/**/*'];
    expect(config?.files).toEqual(expected);
    expect(config?.rules).toHaveProperty('check-file/folder-naming-convention');
    expect(config?.rules).not.toHaveProperty('check-file/filename-naming-convention');
  });
});

describe('base: check-file', () => {
  it('accepts a PascalCase component and a camelCase module', async () => {
    const ruleIds = await ruleIdsFor(layer, SOURCE, 'src/components/ui/Widget.tsx');
    expect(ruleIds).not.toContain('check-file/filename-naming-convention');

    const layerRuleIds = await ruleIdsFor(layer, SOURCE, 'src/lib/utils/formatDate.ts');
    expect(layerRuleIds).not.toContain('check-file/filename-naming-convention');
  });

  it('reports a kebab-case module where camelCase is configured', async () => {
    const ruleIds = await ruleIdsFor(layer, SOURCE, 'src/lib/utils/format-date.ts');
    expect(ruleIds).toContain('check-file/filename-naming-convention');
  });

  it('judges a test file on the name before the middle extension', async () => {
    const ruleIds = await ruleIdsFor(layer, SOURCE, 'src/lib/utils/formatDate.test.ts');
    expect(ruleIds).not.toContain('check-file/filename-naming-convention');
  });

  it('reports a folder that is not kebab-case', async () => {
    const ruleIds = await ruleIdsFor(layer, SOURCE, 'src/lib/dateUtils/formatDate.ts');
    expect(ruleIds).toContain('check-file/folder-naming-convention');
  });

  it('judges a file outside the script globs without losing the plugin', async () => {
    const withHtml = [...layer, ...html()];

    const ruleIds = await ruleIdsFor(withHtml, '<!doctype html>\n', 'src/themeTokens/index.html');
    expect(ruleIds).toContain('check-file/folder-naming-convention');
  });

  it('enforces nothing when no naming map is passed', async () => {
    const ruleIds = await ruleIdsFor(base(), SOURCE, 'src/lib/utils/format-date.ts');

    expect(ruleIds).not.toContain('check-file/filename-naming-convention');
    expect(ruleIds).not.toContain('check-file/folder-naming-convention');
  });
});
