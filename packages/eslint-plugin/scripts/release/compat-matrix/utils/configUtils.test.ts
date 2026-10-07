import { TS_EXPECTED } from '../constants.ts';

import { tsFlatConfig, tsLegacyConfig } from './configUtils.ts';

describe('tsLegacyConfig', () => {
  it('turns on every expected rule under the TypeScript parser', () => {
    const config: unknown = JSON.parse(tsLegacyConfig());

    const rules = Object.fromEntries(TS_EXPECTED
      .map((id) => {
        const setting: [string, string] = [id, 'error'];

        return setting;
      }));
    const expected = {
      root: true,
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
      },
      plugins: ['@linteljs'],
      rules,
    };
    expect(config).toEqual(expected);
  });
});

describe('tsFlatConfig', () => {
  it('turns on every expected rule for TypeScript files', () => {
    const config = tsFlatConfig();

    const expected = [
      "import parser from '@typescript-eslint/parser';",
      "import linteljs from '@linteljs/eslint-plugin';",
      '',
      'export default [',
      '  {',
      "    files: ['**/*.ts'],",
      '    languageOptions: { parser },',
      "    plugins: { '@linteljs': linteljs },",
      '    rules: {',
      "      \"@linteljs/array-newline\": 'error',",
      "      \"@linteljs/interface-order\": 'error',",
      "      \"@linteljs/no-duplicate-interface\": 'error',",
      "      \"@linteljs/no-inline-object-types\": 'error',",
      "      \"@linteljs/union-newline\": 'error',",
      '    },',
      '  },',
      "  { linterOptions: { reportUnusedDisableDirectives: 'off' } },",
      '];',
      '',
    ].join('\n');
    expect(config).toBe(expected);
  });
});
