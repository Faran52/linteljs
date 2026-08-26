import { ruleIdsFor } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base';
import html from '../html';

import { buildNaming } from './checkFileUtils';

import type { NamingMap } from '../types';

const NAMING: NamingMap = {
  'src/components/**/*.tsx': 'PASCAL_CASE',
  'src/**/*.ts': 'CAMEL_CASE',
};

const FOLDER_NAMING: NamingMap = { 'src/**/': 'KEBAB_CASE' };

const layer = base({
  naming: NAMING,
  folderNaming: FOLDER_NAMING,
});

const SOURCE = 'export const value = 1;\n';

describe('buildNaming', () => {
  it('returns nothing when neither map is supplied', () => {
    expect(buildNaming()).toEqual([]);
  });

  it('derives its files glob from the maps rather than restating src', () => {
    const [config] = buildNaming(NAMING, FOLDER_NAMING);

    expect(config?.files).toEqual(['src/components/**/*.tsx', 'src/**/*.ts', 'src/**/*']);
  });

  it('omits the folder rule when only filenames are configured', () => {
    const [config] = buildNaming(NAMING);

    expect(config?.rules).toHaveProperty('check-file/filename-naming-convention');
    expect(config?.rules).not.toHaveProperty('check-file/folder-naming-convention');
  });

  it('omits the filename rule when only folders are configured', () => {
    const [config] = buildNaming(undefined, FOLDER_NAMING);

    expect(config?.files).toEqual(['src/**/*']);
    expect(config?.rules).toHaveProperty('check-file/folder-naming-convention');
    expect(config?.rules).not.toHaveProperty('check-file/filename-naming-convention');
  });
});

describe('base: check-file', () => {
  it('accepts a PascalCase component and a camelCase module', async () => {
    await expect(ruleIdsFor(layer, SOURCE, 'src/components/ui/Widget.tsx'))
      .resolves.not.toContain('check-file/filename-naming-convention');
    await expect(ruleIdsFor(layer, SOURCE, 'src/lib/utils/formatDate.ts'))
      .resolves.not.toContain('check-file/filename-naming-convention');
  });

  it('reports a kebab-case module where camelCase is configured', async () => {
    await expect(ruleIdsFor(layer, SOURCE, 'src/lib/utils/format-date.ts'))
      .resolves.toContain('check-file/filename-naming-convention');
  });

  it('judges a test file on the name before the middle extension', async () => {
    await expect(ruleIdsFor(layer, SOURCE, 'src/lib/utils/formatDate.test.ts'))
      .resolves.not.toContain('check-file/filename-naming-convention');
  });

  it('reports a folder that is not kebab-case', async () => {
    await expect(ruleIdsFor(layer, SOURCE, 'src/lib/dateUtils/formatDate.ts'))
      .resolves.toContain('check-file/folder-naming-convention');
  });

  // The derived folder glob reaches files `base`'s script blocks never see: an `.html` opted in by `html()`
  // still crosses the naming block, so it registers the plugin itself or ESLint can't resolve the rule and exits 2.
  it('judges a file outside the script globs without losing the plugin', async () => {
    const withHtml = [...layer, ...html()];

    await expect(ruleIdsFor(withHtml, '<!doctype html>\n', 'src/themeTokens/index.html'))
      .resolves.toContain('check-file/folder-naming-convention');
  });

  it('enforces nothing when no naming map is passed', async () => {
    const ruleIds = await ruleIdsFor(base(), SOURCE, 'src/lib/utils/format-date.ts');

    expect(ruleIds).not.toContain('check-file/filename-naming-convention');
    expect(ruleIds).not.toContain('check-file/folder-naming-convention');
  });
});
