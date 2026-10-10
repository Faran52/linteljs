import { expect, it } from 'vitest';

import { eslintConfigWriter } from './eslintConfigWriter';

it('writes each option as source', () => {
  const text = eslintConfigWriter({
    target: 'react',
    strict: true,
    width: 120,
    ignores: ['dist'],
    aliases: { '@/*': './src/*' },
  });
  const expected = [
    "import { linteljs } from '@linteljs/eslint-config';",
    '',
    'const config = await linteljs({',
    "  target: 'react',",
    '  strict: true,',
    '  width: 120,',
    "  ignores: ['dist'],",
    '  aliases: {',
    "    '@/*': './src/*',",
    '  },',
    '});',
    '',
    'export default config;',
    '',
  ].join('\n');

  expect(text).toBe(expected);
});

it('refuses a null option', () => {
  const writing = (): void => {
    eslintConfigWriter({ target: null });
  };

  expect(writing).toThrow('eslint option target cannot be null');
});
