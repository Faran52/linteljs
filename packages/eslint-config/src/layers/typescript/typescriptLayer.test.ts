import { join } from 'node:path';

import {
  enabledRuleIdsFor,
  frameworkRuleIdsFor,
  ownBlockNames,
  ruleEntryFor,
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

const DESTRUCTURING_FILE = join(import.meta.dirname, '../../../__mocks__/fixtures/typed/destructuring.ts');

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

  it('prefers destructuring in an object declaration only, through the typed twin', async () => {
    const ruleIds = await ruleIdsForFile([...base(), ...typescript()], DESTRUCTURING_FILE);
    const reported = ruleIds
      .filter((ruleId) => {
        return ruleId === '@typescript-eslint/prefer-destructuring';
      });

    expect(reported).toHaveLength(1);
    expect(ruleIds).not.toContain('prefer-destructuring');
  });

  it('restates every prefer-destructuring option on a TypeScript file', async () => {
    const layer = [...base(), ...typescript()];
    const entry = await ruleEntryFor(layer, 'src/a.ts', '@typescript-eslint/prefer-destructuring');
    const enabled = await enabledRuleIdsFor(layer, 'src/a.ts');

    expect(entry).toEqual([
      2,
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
        enforceForDeclarationWithTypeAnnotation: false,
      },
    ]);

    expect(enabled).not.toContain('prefer-destructuring');
  });

  it('turns the type-aware rules off a plain .js file', async () => {
    await expect(ruleNamesFor([...base(), ...typescript()], 'src/tool.js'))
      .resolves.toContain('@typescript-eslint/no-floating-promises');

    await expect(enabledRuleIdsFor([...base(), ...typescript()], 'src/tool.js'))
      .resolves.not.toContain('@typescript-eslint/no-floating-promises');
  });

  it('restates the prefer-alias defaults', () => {
    const block = typescript()
      .find(({ name }) => {
        return name === '@linteljs/typescript/prefer-alias';
      });

    expect(block?.rules).toEqual({
      '@linteljs/prefer-alias': ['error', {
        aliasExempt: [],
        enforceRelativeImports: false,
      }],
    });
  });

  it('configures prefer-alias on every typed extension, the SFCs included', async () => {
    const layer = [...base(), ...typescript({ aliasExempt: ['src/routes.ts'] })];

    for (const file of [
      'src/a.ts',
      'src/a.tsx',
      'src/A.vue',
      'src/A.svelte',
    ]) {
      const entry = await ruleEntryFor(layer, file, '@linteljs/prefer-alias');

      expect({
        file,
        entry,
      }).toEqual({
        file,
        entry: [2, {
          aliasExempt: ['src/routes.ts'],
          enforceRelativeImports: false,
        }],
      });
    }
  });

  it('enables no framework rule on a TypeScript file', async () => {
    const leaked = await frameworkRuleIdsFor([...base(), ...typescript()], 'src/lib/utils/sample.ts');

    expect(leaked).toStrictEqual([]);
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(typescript())).toEqual([
      '@linteljs/typescript',
      '@linteljs/typescript/untyped',
      '@linteljs/typescript/prefer-destructuring',
      '@linteljs/typescript/unused-vars-handover',
      '@linteljs/typescript/prefer-alias',
      '@linteljs/typescript/asset-requires',
    ]);
  });
});
