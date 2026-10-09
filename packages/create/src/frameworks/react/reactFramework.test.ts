import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitI18nConfig } from '@emitters/libraries/i18n-config/i18nConfigEmitter';
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
    const i18nConfig = emitI18nConfig([]);

    expect(framed.files).toEqual([
      {
        path: 'index.html',
        text: page,
      },
      {
        path: 'src/i18n/config.ts',
        text: i18nConfig,
      },
    ]);

    expect(framed.share).toEqual({
      package: {
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
          typecheck: 'tsc --noEmit',
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
      languages: ['en'],
    });
    const i18nConfig = emitI18nConfig(['en']);

    expect(framed).toEqual({
      files: [{
        path: 'src/i18n/config.ts',
        text: i18nConfig,
      }],
      share: {
        package: {
          scripts: { typecheck: 'react-router typegen && tsc --noEmit' },
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

  it('builds the i18n config from the chosen languages in their chosen order', () => {
    const framed = reactFramework('demo', {
      target: 'react',
      languages: ['ar', 'en'],
    });
    const i18nConfig = framed.files
      .find((file) => {
        return file.path === 'src/i18n/config.ts';
      });
    const expected = emitI18nConfig(['ar', 'en']);

    expect(i18nConfig?.text).toBe(expected);
  });
});
