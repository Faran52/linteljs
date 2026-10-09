import {
  describe,
  expect,
  it,
} from 'vitest';

import { FAVICON } from '@emitters/target/html-entry/constants';
import { emitHtmlEntry } from '@emitters/target/html-entry/htmlEntryEmitter';

import { reactFramework } from './reactFramework';

const NAMING = {
  'src/**/*.tsx': '!([a-z]*[A-Z]*)',
  'src/**/!(*.d|*.test|*.spec|*.styles).ts': 'CAMEL_CASE',
  'src/**/*.styles.ts': '!([a-z]*[A-Z]*)',
  '**/utils/*.ts': '*Utils',
  'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
};

const FOLDER_NAMING = { 'src/**/': String.raw`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\[*\]|\(*\)|{*})` };

describe('reactFramework', () => {
  it('writes the Vite document under the unscoped name, with its scripts and html linting', () => {
    const framed = reactFramework('@acme/demo', { target: 'react' });
    const page = emitHtmlEntry('demo', 'src/main.tsx', FAVICON);

    expect(framed.files).toEqual([{
      path: 'index.html',
      text: page,
    }]);

    expect(framed.share).toEqual({
      package: {
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        devDependencies: {
          '@eslint-react/eslint-plugin': '^5.23.5',
          '@html-eslint/eslint-plugin': '^0.66.1',
          '@html-eslint/parser': '^0.66.1',
          '@types/react': '^19.3.0',
          '@types/react-dom': '^19.3.0',
          '@vitejs/plugin-react': '6.1.1',
          'eslint-plugin-jsx-a11y-x': '^0.2.0',
          'eslint-plugin-react-hooks': '^7.1.1',
          'oxc-transform-react': '^0.145.0',
          'typescript': '~6.0.3',
          'vite': '^8.3.2',
        },
      },
      eslint: {
        framework: 'react',
        typescript: true,
        ignores: ['dist/**', 'coverage/**'],
        naming: NAMING,
        folderNaming: FOLDER_NAMING,
        html: true,
      },
    });
  });

  it('leaves the document, scripts and compiler to React Router in framework mode', () => {
    const framed = reactFramework('demo', {
      target: 'react',
      router: 'react-router-framework',
    });

    expect(framed).toEqual({
      files: [],
      share: {
        package: {
          devDependencies: {
            '@eslint-react/eslint-plugin': '^5.23.5',
            '@types/react': '^19.3.0',
            '@types/react-dom': '^19.3.0',
            '@vitejs/plugin-react': '6.1.1',
            'eslint-plugin-jsx-a11y-x': '^0.2.0',
            'eslint-plugin-react-hooks': '^7.1.1',
            'typescript': '~6.0.3',
            'vite': '^8.3.2',
          },
        },
        eslint: {
          framework: 'react',
          typescript: true,
          ignores: ['dist/**', 'coverage/**'],
          naming: NAMING,
          folderNaming: FOLDER_NAMING,
        },
      },
    });
  });
});
