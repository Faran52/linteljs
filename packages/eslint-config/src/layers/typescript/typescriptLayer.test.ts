import { join } from 'node:path';

import {
  enabledRuleIdsFor,
  ownBlockNames,
  ruleIdsForFile,
  ruleNamesFor,
} from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base/baseLayer';

import typescript from './typescriptLayer';

const TYPED_FILE = join(import.meta.dirname, '../../../__mocks__/fixtures/typed/floating.ts');

const UNUSED_FILE = join(import.meta.dirname, '../../../__mocks__/fixtures/typed/unused.ts');

const REQUIRES_FILE = join(import.meta.dirname, '../../../__mocks__/fixtures/typed/requires.ts');

describe('typescript', () => {
  it('reports a floating promise, which needs type information to see', async () => {
    await expect(ruleIdsForFile([...base(), ...typescript()], TYPED_FILE))
      .resolves.toContain('@typescript-eslint/no-floating-promises');
  });

  it('leaves one owner for unused code once the typed layer is composed', async () => {
    const ruleIds = await ruleIdsForFile([...base(), ...typescript()], UNUSED_FILE);

    expect(ruleIds).toContain('unused-imports/no-unused-imports');
    expect(ruleIds).toContain('unused-imports/no-unused-vars');
    expect(ruleIds).not.toContain('@typescript-eslint/no-unused-vars');
    expect(ruleIds).not.toContain('sonarjs/unused-import');
    expect(ruleIds).not.toContain('sonarjs/no-unused-vars');
    expect(ruleIds).not.toContain('no-unused-vars');
  });

  it('permits a require of a bundler asset while still reporting a require of a module', async () => {
    const ruleIds = await ruleIdsForFile([...base(), ...typescript()], REQUIRES_FILE);
    const reported = ruleIds
      .filter((ruleId) => {
        return ruleId === '@typescript-eslint/no-require-imports';
      });

    expect(reported).toHaveLength(1);
  });

  it('turns the type-aware rules off a plain .js file', async () => {
    await expect(ruleNamesFor([...base(), ...typescript()], 'src/tool.js'))
      .resolves.toContain('@typescript-eslint/no-floating-promises');
    await expect(enabledRuleIdsFor([...base(), ...typescript()], 'src/tool.js'))
      .resolves.not.toContain('@typescript-eslint/no-floating-promises');
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(typescript())).toEqual([
      '@linteljs/typescript',
      '@linteljs/typescript/untyped',
      '@linteljs/typescript/unused-vars-handover',
      '@linteljs/typescript/asset-requires',
    ]);
  });
});
