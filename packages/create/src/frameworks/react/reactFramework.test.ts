import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitLinteljsRecord, RECORD_MODULE } from '@emitters/always/linteljs-record/linteljsRecordEmitter';
import { emitStylelintConfig } from '@emitters/always/stylelint-config/stylelintConfigEmitter';
import { tsconfigSource } from '@emitters/always/tsconfig/tsconfigEmitter';
import { buildScripts } from '@emitters/always/utils/scriptUtils';
import { emitI18nConfig } from '@emitters/libraries/i18n-config/i18nConfigEmitter';
import { FAVICON } from '@emitters/target/html-entry/constants';
import { emitHtmlEntry } from '@emitters/target/html-entry/htmlEntryEmitter';
import { emitViteConfig } from '@emitters/target/vite-config/viteConfigEmitter';
import { testSetupEmitter } from '@emitters/testing/test-setup/testSetupEmitter';
import { emitVitestConfig } from '@emitters/testing/vitest-config/vitestConfigEmitter';

import { SETUP_TESTS } from './constants';
import { reactFramework } from './reactFramework';

import type { Answered } from '@choices/read/manifest/manifestReader';
import type {
  Answers,
  Host,
  ProjectShape,
} from '@config/types';

type Picked = Pick<Answers, 'testing'> & Partial<Pick<Answers, 'styling'
  | 'router'
  | 'data'
  | 'mocking'>>;

const HOST: Host = {
  packageManager: 'pnpm',
  packageManagerVersion: '11.0.0',
  nodeVersion: '26.0.0',
};

// The answers a default React run records, as `answersFor` holds them.
const RECORDED: Answered = {
  target: 'react',
  layout: 'single',
  testing: 'vitest',
  libraries: ['es-toolkit'],
  typeSafety: 'strict',
  agents: ['claude-code'],
  plugins: [
    'ponytail',
    'context7',
    'frontend-design',
  ],
};

const FRESH: ProjectShape = {
  setupTests: [],
  styleEntries: [],
};

const CONFIG_PATHS = [
  'vite.config.ts',
  'stylelint.config.js',
  'vitest.config.ts',
  '__mocks__/setupTests.tsx',
];

const PARITY: Picked[] = [
  { testing: 'vitest' },
  { testing: 'none' },
  {
    testing: 'vitest',
    styling: 'stylex',
    router: 'react-router-framework',
    data: 'rtk-query',
  },
  {
    testing: 'vitest',
    styling: 'tailwind',
    router: 'tanstack-router',
    data: 'tanstack-query',
    mocking: 'msw',
  },
  {
    testing: 'vitest',
    router: 'react-router',
  },
  {
    testing: 'none',
    styling: 'stylex',
  },
];

const RECORD_PARITY: (Picked & Partial<Pick<Answers, 'languages'>>)[] = [
  ...PARITY,
  {
    testing: 'vitest',
    languages: ['en', 'ar'],
  },
  {
    testing: 'none',
    router: 'tanstack-router',
    languages: ['ar'],
  },
];

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
    const framed = reactFramework('@acme/demo', { target: 'react' }, HOST);
    const page = emitHtmlEntry('demo', 'src/main.tsx', FAVICON);
    const i18nConfig = emitI18nConfig([]);
    const tsconfig = tsconfigSource({
      delta: { jsx: 'react-jsx' },
      browser: true,
      types: ['node', 'vite/client'],
      aliases: ALIASES,
      include: [],
    });

    const paths = framed.files
      .map((file) => {
        return file.path;
      });

    expect(paths).toEqual([
      'index.html',
      'src/i18n/config.ts',
      'tsconfig.json',
      'vite.config.ts',
      'stylelint.config.js',
    ]);

    expect(framed.files).toContainEqual({
      path: 'index.html',
      text: page,
    });

    expect(framed.files).toContainEqual({
      path: 'src/i18n/config.ts',
      text: i18nConfig,
    });

    expect(framed.files).toContainEqual({
      path: 'tsconfig.json',
      text: tsconfig,
    });

    expect(framed.share).toEqual({
      package: {
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
          typecheck: 'tsc --noEmit',
        },
        devDependencies: {
          '@eslint-react/eslint-plugin': '^5.24.8',
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
      install: [],
    });
  });

  it('leaves the document, scripts and compiler to React Router in framework mode', () => {
    const framed = reactFramework('demo', {
      target: 'react',
      router: 'react-router-framework',
      languages: ['en'],
    }, HOST);
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

    const paths = framed.files
      .map((file) => {
        return file.path;
      });

    expect(paths).toEqual([
      'src/i18n/config.ts',
      'tsconfig.json',
      'vite.config.ts',
      'stylelint.config.js',
    ]);

    expect(framed.files).toContainEqual({
      path: 'src/i18n/config.ts',
      text: i18nConfig,
    });

    expect(framed.files).toContainEqual({
      path: 'tsconfig.json',
      text: tsconfig,
    });

    expect(framed.share).toEqual({
      package: {
        scripts: { typecheck: 'react-router typegen && tsc --noEmit' },
        devDependencies: {
          '@eslint-react/eslint-plugin': '^5.24.8',
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
      install: ['react-router typegen'],
    });
  });

  it('builds the i18n config from the chosen languages in their chosen order', () => {
    const framed = reactFramework('demo', {
      target: 'react',
      languages: ['ar', 'en'],
    }, HOST);
    const expected = {
      path: 'src/i18n/config.ts',
      text: emitI18nConfig(['ar', 'en']),
    };

    expect(framed.files).toContainEqual(expected);
  });

  it.each(PARITY)('writes the old pipeline\'s vite, vitest, setup and stylelint files for %o', (picked) => {
    const framed = reactFramework('demo', {
      target: 'react',
      ...picked,
    }, HOST);
    const old = answersFor({
      target: 'react',
      languages: ['en'],
      ...picked,
    });
    const vite = emitViteConfig(old);
    const vitest = emitVitestConfig(old, SETUP_TESTS);
    const [setup] = testSetupEmitter(old, FRESH);
    const expected = [
      {
        path: 'vite.config.ts',
        text: vite,
      },
      {
        path: 'stylelint.config.js',
        text: emitStylelintConfig(old),
      },
      ...vitest === null
        ? []
        : [{
            path: 'vitest.config.ts',
            text: vitest,
          }],
      ...setup === undefined
        ? []
        : [{
            path: SETUP_TESTS,
            ...setup.content,
          }],
    ];
    const built = framed.files
      .filter((file) => {
        return CONFIG_PATHS.includes(file.path);
      });

    expect(built).toEqual(expected);
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
    }, HOST);
    const tsconfig = tsconfigSource({
      delta: { jsx: 'react-jsx' },
      browser: true,
      types,
      aliases: ALIASES,
      include: [],
    });
    const expected = {
      path: 'tsconfig.json',
      text: tsconfig,
    };

    expect(framed.files).toContainEqual(expected);
  });

  it.each([
    ['data', 'tanstack-query'],
    ['data', 'rtk-query'],
    ['store', 'redux-toolkit'],
  ])('aliases @apis when %s is %s, which writes src/lib/apis', (key, value) => {
    const framed = reactFramework('demo', {
      target: 'react',
      [key]: value,
    }, HOST);
    const { eslint } = framed.share;

    expect(eslint).toHaveProperty(['aliases', '@apis/*'], './src/lib/apis/*');
  });

  it('aliases no @apis when no drawer writes src/lib/apis', () => {
    const framed = reactFramework('demo', {
      target: 'react',
      data: 'none',
      store: 'zustand',
    }, HOST);
    const { eslint } = framed.share;

    expect(eslint).not.toHaveProperty(['aliases', '@apis/*']);
  });

  it.each(RECORD_PARITY)('writes the old record from the merged scripts for %o', (picked) => {
    const framed = reactFramework('@acme/demo', {
      ...RECORDED,
      ...picked,
    }, HOST);
    const answers = {
      ...answersFor(picked),
      ...HOST,
    };
    const record = framed.record(buildScripts(answers));
    const expected = {
      path: RECORD_MODULE,
      text: emitLinteljsRecord(answers, 'demo'),
    };

    expect(record).toEqual(expected);
  });
});
