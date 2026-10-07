import { TS_EXPECTED } from '../constants.ts';

const tsRules = (): Record<string, string> => {
  const settings = TS_EXPECTED
    .map((id) => {
      const setting: [string, string] = [id, 'error'];

      return setting;
    });
  const rules = Object.fromEntries(settings);

  return rules;
};

export const tsLegacyConfig = (): string => {
  const config = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2019,
      sourceType: 'module',
    },
    plugins: ['@linteljs'],
    rules: tsRules(),
  };

  return JSON.stringify(config, null, 2);
};

export const tsFlatConfig = (): string => {
  const lines = [
    "import parser from '@typescript-eslint/parser';",
    "import linteljs from '@linteljs/eslint-plugin';",
    '',
    'export default [',
    '  {',
    "    files: ['**/*.ts'],",
    '    languageOptions: { parser },',
    "    plugins: { '@linteljs': linteljs },",
    '    rules: {',
    ...TS_EXPECTED
      .map((id) => {
        return `      ${JSON.stringify(id)}: 'error',`;
      }),
    '    },',
    '  },',
    "  { linterOptions: { reportUnusedDisableDirectives: 'off' } },",
    '];',
    '',
  ];

  return lines.join('\n');
};
