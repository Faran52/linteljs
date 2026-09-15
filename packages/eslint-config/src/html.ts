import htmlPlugin from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';

import { presetOf } from './utils/presetUtils';

import type { Layer } from './types';

// Every target but Angular, whose template processor covers markup.
export const html = (): Layer => {
  return [
    {
      ...presetOf(htmlPlugin.configs['flat/recommended'], 'html-eslint/flat/recommended')[0],
      name: '@linteljs/html',
      files: ['**/*.html'],
      languageOptions: { parser: htmlParser },
    },
  ];
};

export default html;
