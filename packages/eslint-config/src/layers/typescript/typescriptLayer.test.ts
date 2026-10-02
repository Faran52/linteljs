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

const PROPERTIES_FILE = join(import.meta.dirname, '../../../__mocks__/fixtures/typed/properties.ts');

describe('typescript', () => {
  it('reports a floating promise, which needs type information to see', async () => {
    const config = [...base(), ...typescript()];
    const actual = await ruleIdsForFile(config, TYPED_FILE);
    expect(actual).toContain('@typescript-eslint/no-floating-promises');
  });

  it('leaves one owner for unused code once the typed layer is composed', async () => {
    const config = [...base(), ...typescript()];
    const ruleIds = await ruleIdsForFile(config, UNUSED_FILE);

    expect(ruleIds).toContain('unused-imports/no-unused-imports');
    expect(ruleIds).toContain('unused-imports/no-unused-vars');
    expect(ruleIds).not.toContain('@typescript-eslint/no-unused-vars');
    expect(ruleIds).not.toContain('sonarjs/unused-import');
    expect(ruleIds).not.toContain('sonarjs/no-unused-vars');
    expect(ruleIds).not.toContain('no-unused-vars');
  });

  it('permits a require of a bundler asset while still reporting a require of a module', async () => {
    const config = [...base(), ...typescript()];
    const ruleIds = await ruleIdsForFile(config, REQUIRES_FILE);
    const reported = ruleIds
      .filter((ruleId) => {
        return ruleId === '@typescript-eslint/no-require-imports';
      });

    expect(reported).toHaveLength(1);
  });

  it('prefers destructuring in an object declaration only, through the typed twin', async () => {
    const config = [...base(), ...typescript()];
    const ruleIds = await ruleIdsForFile(config, DESTRUCTURING_FILE);
    const reported = ruleIds
      .filter((ruleId) => {
        return ruleId === '@typescript-eslint/prefer-destructuring';
      });

    expect(reported).toHaveLength(1);
    expect(ruleIds).not.toContain('prefer-destructuring');
  });

  it('reports a parameter property and leaves a declared class property alone', async () => {
    const config = [...base(), ...typescript()];
    const ruleIds = await ruleIdsForFile(config, PROPERTIES_FILE);
    const reported = ruleIds
      .filter((ruleId) => {
        return ruleId === '@typescript-eslint/parameter-properties';
      });

    expect(reported).toHaveLength(1);
  });

  it('restates every parameter-properties option, a rule base leaves to this layer', async () => {
    const layer = [...base(), ...typescript()];
    const entry = await ruleEntryFor(layer, 'src/a.ts', '@typescript-eslint/parameter-properties');
    const baseRuleNames = await ruleNamesFor(base(), 'src/a.ts');

    const expected = [2, {
      allow: [],
      prefer: 'class-property',
    }];
    expect(entry).toEqual(expected);

    expect(baseRuleNames).not.toContain('@typescript-eslint/parameter-properties');
  });

  it('restates every prefer-destructuring option on a TypeScript file', async () => {
    const layer = [...base(), ...typescript()];
    const entry = await ruleEntryFor(layer, 'src/a.ts', '@typescript-eslint/prefer-destructuring');
    const enabled = await enabledRuleIdsFor(layer, 'src/a.ts');

    const expected = [
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
    ];
    expect(entry).toEqual(expected);

    expect(enabled).not.toContain('prefer-destructuring');
  });

  it('turns the type-aware rules off a plain .js file', async () => {
    const config = [...base(), ...typescript()];
    const ruleNames = await ruleNamesFor(config, 'src/tool.js');
    expect(ruleNames).toContain('@typescript-eslint/no-floating-promises');

    const enabledRuleIdsForConfig = [...base(), ...typescript()];
    const enabledRuleIds = await enabledRuleIdsFor(enabledRuleIdsForConfig, 'src/tool.js');
    expect(enabledRuleIds).not.toContain('@typescript-eslint/no-floating-promises');
  });

  it('restates the prefer-alias defaults', () => {
    const block = typescript()
      .find(({ name }) => {
        return name === '@linteljs/typescript/prefer-alias';
      });

    const expected = {
      '@linteljs/prefer-alias': ['error', {
        aliasExempt: [],
        enforceRelativeImports: false,
      }],
    };
    expect(block?.rules).toEqual(expected);
  });

  it('configures prefer-alias on every typed extension, the SFCs included', async () => {
    const typescriptOptions = { aliasExempt: ['src/routes.ts'] };
    const layer = [...base(), ...typescript(typescriptOptions)];

    const itList = [
      'src/a.ts',
      'src/a.tsx',
      'src/A.vue',
      'src/A.svelte',
    ];

    for (const file of itList) {
      const entry = await ruleEntryFor(layer, file, '@linteljs/prefer-alias');

      const actual = {
        file,
        entry,
      };
      const expected = {
        file,
        entry: [2, {
          aliasExempt: ['src/routes.ts'],
          enforceRelativeImports: false,
        }],
      };
      expect(actual).toEqual(expected);
    }
  });

  it('enables no framework rule on a TypeScript file', async () => {
    const config = [...base(), ...typescript()];
    const leaked = await frameworkRuleIdsFor(config, 'src/lib/utils/sample.ts');

    expect(leaked).toStrictEqual([]);
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(typescript());
    const expected = [
      '@linteljs/typescript',
      '@linteljs/typescript/untyped',
      '@linteljs/typescript/prefer-destructuring',
      '@linteljs/typescript/unused-vars-handover',
      '@linteljs/typescript/prefer-alias',
      '@linteljs/typescript/asset-requires',
    ];
    expect(actual).toEqual(expected);
  });
});
