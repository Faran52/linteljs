import {
  describe,
  expect,
  it,
} from 'vitest';

import { tsconfigSource } from '@emitters/always/tsconfig/tsconfigEmitter';
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

const ALIASES = {
  '@router/*': './src/router/*',
  '@pages/*': './src/pages/*',
  '@components/*': './src/components/*',
  '@ui/*': './src/components/ui/*',
  '@ui': './src/components/ui',
  '@features/*': './src/components/features/*',
  '@lib/*': './src/lib/*',
  '@store/*': './src/lib/store/*',
  '@hooks/*': './src/lib/hooks/*',
  '@utils/*': './src/lib/utils/*',
  '@services/*': './src/lib/services/*',
  '@styles/*': './src/styles/*',
  '@config/*': './src/config/*',
  '@i18n/*': './src/i18n/*',
  '@mocks/*': './__mocks__/*',
};

const FOLDER_NAMING = { 'src/**/': String.raw`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\[*\]|\(*\)|{*})` };

describe('reactFramework', () => {
  it('writes the Vite document under the unscoped name, with its scripts and html linting', () => {
    const framed = reactFramework('@acme/demo', { target: 'react' });
    const page = emitHtmlEntry('demo', 'src/main.tsx', FAVICON);
    const i18nConfig = emitI18nConfig([]);
    const tsconfig = tsconfigSource({
      delta: { jsx: 'react-jsx' },
      browser: true,
      types: ['node', 'vite/client'],
      aliases: ALIASES,
      include: [],
    });

    expect(framed.files).toEqual([
      {
        path: 'index.html',
        text: page,
      },
      {
        path: 'src/i18n/config.ts',
        text: i18nConfig,
      },
      {
        path: 'tsconfig.json',
        text: tsconfig,
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
        aliases: ALIASES,
        naming: NAMING,
        folderNaming: FOLDER_NAMING,
        html: true,
      },
      gitignore: [
        'dist',
        'dist-ssr',
        '*.local',
      ],
    });
  });

  it('leaves the document, scripts and compiler to React Router in framework mode', () => {
    const framed = reactFramework('demo', {
      target: 'react',
      router: 'react-router-framework',
      languages: ['en'],
    });
    const i18nConfig = emitI18nConfig(['en']);
    const tsconfig = tsconfigSource({
      delta: {
        jsx: 'react-jsx',
        include: ['.react-router/types/**/*'],
        rootDirs: ['.', './.react-router/types'],
      },
      browser: true,
      types: ['node', 'vite/client'],
      aliases: ALIASES,
      include: [],
    });

    expect(framed).toEqual({
      files: [
        {
          path: 'src/i18n/config.ts',
          text: i18nConfig,
        },
        {
          path: 'tsconfig.json',
          text: tsconfig,
        },
      ],
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
          aliases: ALIASES,
          naming: NAMING,
          folderNaming: FOLDER_NAMING,
        },
        gitignore: ['/.react-router/', '/build/'],
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

  it.each([
    ['vitest', [
      'node',
      'vite/client',
      'vitest/globals',
    ]],
    ['none', ['node', 'vite/client']],
  ])('writes a tsconfig with every drawer alias, typed for testing %s', (testing, types) => {
    const framed = reactFramework('demo', {
      target: 'react',
      testing,
    });
    const tsconfig = framed.files
      .find((file) => {
        return file.path === 'tsconfig.json';
      });
    const expected = tsconfigSource({
      delta: { jsx: 'react-jsx' },
      browser: true,
      types,
      aliases: ALIASES,
      include: [],
    });

    expect(tsconfig?.text).toBe(expected);
  });

  it.each([
    ['data', 'tanstack-query'],
    ['data', 'rtk-query'],
    ['store', 'redux-toolkit'],
  ])('aliases @apis when %s is %s, which writes src/lib/apis', (key, value) => {
    const framed = reactFramework('demo', {
      target: 'react',
      [key]: value,
    });
    const { eslint } = framed.share;

    expect(eslint).toHaveProperty(['aliases', '@apis/*'], './src/lib/apis/*');
  });

  it('aliases no @apis when no drawer writes src/lib/apis', () => {
    const framed = reactFramework('demo', {
      target: 'react',
      data: 'none',
      store: 'zustand',
    });
    const { eslint } = framed.share;

    expect(eslint).not.toHaveProperty(['aliases', '@apis/*']);
  });
});
