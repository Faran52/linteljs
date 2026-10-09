import { LANGUAGES } from '@config/constants';

import { unscopedName } from '@utils/nameUtils';
import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import { type Answered } from '@choices/read/manifest/manifestReader';
import { answeredValues } from '@choices/utils/drawerUtils';
import { stylelintSource } from '@emitters/always/stylelint-config/stylelintConfigEmitter';
import { tsconfigSource } from '@emitters/always/tsconfig/tsconfigEmitter';
import { HTML_DEV_DEPENDENCIES, TEST_RUNNERS } from '@emitters/constants';
import { emitI18nConfig } from '@emitters/libraries/i18n-config/i18nConfigEmitter';
import { FAVICON } from '@emitters/target/html-entry/constants';
import { emitHtmlEntry } from '@emitters/target/html-entry/htmlEntryEmitter';
import { viteConfigSource } from '@emitters/target/vite-config/viteConfigEmitter';
import { BASE_SETUP, QUERY_SETUP } from '@emitters/testing/test-setup/constants';
import { excludedWith, measuredGlob } from '@emitters/testing/utils/coverageUtils';
import { mergedVitestSource } from '@emitters/testing/vitest-config/vitestConfigEmitter';
import { standardAliases, withBarrels } from '@emitters/utils/aliasUtils';
import { versioned } from '@emitters/utils/packageJsonUtils';
import { FOLDER_ROUTED } from '@targets';
import {
  HOOKS_ALIAS,
  PARTS,
  REACT_VITE_PLUGIN,
  ROUTER_MOCK,
  VITE_GITIGNORE,
} from '@targets/constants';
import {
  FRAMEWORK_MODE_VITE_PLUGIN,
  REACT_I18N_SETUP,
  ROUTER_ALIAS,
} from '@targets/react/constants';
import { componentNaming } from '@targets/utils/namingUtils';

import {
  BARRELS,
  FRAMEWORK_MODE_COVERAGE_EXCLUDE,
  FRAMEWORK_MODE_GITIGNORE,
  FRAMEWORK_MODE_LEAVES,
  FRAMEWORK_MODE_TSCONFIG,
  FRAMEWORK_MODE_TYPECHECK,
  IGNORES,
  ROUTES_COVERAGE_EXCLUDE,
  SETUP_TESTS,
  VITE_SCRIPTS,
  VITE_TSCONFIG,
} from './constants';

import type {
  Framed,
  FrameworkModule,
  Generated,
  Joined,
} from '../types';

// Vitest merges over `vite.config.ts`; the setup joins its fragments in the order each one needs.
const testFiles = (answers: Answered, frameworkMode: boolean): (Generated | Joined)[] => {
  if (answers.testing !== 'vitest') {
    return [];
  }

  const routed = frameworkMode || answers.router === 'react-router';
  const config = mergedVitestSource({
    include: measuredGlob(),
    exclude: excludedWith([
      ...frameworkMode ? FRAMEWORK_MODE_COVERAGE_EXCLUDE : [],
      ...routed ? ROUTES_COVERAGE_EXCLUDE : [],
    ]),
    setup: SETUP_TESTS,
    target: {},
    stylex: answers.styling === 'stylex',
  });
  const files: (Generated | Joined)[] = [
    {
      path: 'vitest.config.ts',
      text: config,
    },
    {
      path: SETUP_TESTS,
      sources: [
        BASE_SETUP,
        ROUTER_MOCK,
        ...answers.data === 'tanstack-query' ? [QUERY_SETUP] : [],
        REACT_I18N_SETUP,
        ...answers.mocking === 'msw' ? [TEST_RUNNERS.vitest.mswSetup] : [],
      ],
    },
  ];

  return files;
};

// React's own share and files over its drawers; React Router's framework mode brings its own scripts and document.
export const reactFramework: FrameworkModule = (name, answers) => {
  const frameworkMode = answers.router === 'react-router-framework';
  const picked = answeredValues(answers, 'languages');
  const languages = picked
    .flatMap((value) => {
      return LANGUAGES
        .filter((language) => {
          return language === value;
        });
    });
  // The base drawer writes `src/i18n/` and every mocking drawer `__mocks__/`; only these write `src/lib/apis/`.
  const writesApis = answers.data === 'tanstack-query' || answers.data === 'rtk-query'
    || answers.store === 'redux-toolkit';
  const standard = standardAliases({
    routeAlias: ROUTER_ALIAS,
    hooksAlias: HOOKS_ALIAS,
  }, {
    apis: writesApis,
    i18n: true,
    mocks: true,
  });
  const aliases = withBarrels(standard, BARRELS);
  const tsconfig = tsconfigSource({
    delta: frameworkMode ? FRAMEWORK_MODE_TSCONFIG : VITE_TSCONFIG,
    browser: true,
    types: [
      'node',
      'vite/client',
      ...answers.testing === 'vitest' ? [TEST_RUNNERS.vitest.types] : [],
    ],
    aliases,
    include: [],
  });
  const vite = viteConfigSource({
    plugin: frameworkMode ? FRAMEWORK_MODE_VITE_PLUGIN : REACT_VITE_PLUGIN,
    styling: keysOf(ANSWERS.styling.values)
      .find((styling) => {
        return styling === answers.styling;
      }),
    framework: 'react',
    serveMocks: false,
    hmrPort: false,
  });
  const files: (Generated | Joined)[] = [
    {
      path: 'src/i18n/config.ts',
      text: emitI18nConfig(languages),
    },
    {
      path: 'tsconfig.json',
      text: tsconfig,
    },
    {
      path: 'vite.config.ts',
      text: vite,
    },
    {
      path: 'stylelint.config.js',
      text: stylelintSource(answers.styling === 'tailwind'),
    },
    ...testFiles(answers, frameworkMode),
  ];
  const eslint = {
    framework: 'react',
    typescript: true,
    ignores: IGNORES,
    aliases,
    naming: componentNaming(),
    folderNaming: { 'src/**/': FOLDER_ROUTED },
  };
  const devDependencies = [
    ...PARTS.react.devDependencies,
    'vite',
    'typescript',
  ];

  if (frameworkMode) {
    const kept = devDependencies
      .filter((dependency) => {
        return dependency !== FRAMEWORK_MODE_LEAVES;
      });
    const framed: Framed = {
      files,
      share: {
        package: {
          scripts: { typecheck: FRAMEWORK_MODE_TYPECHECK },
          devDependencies: versioned(kept),
        },
        eslint,
        gitignore: FRAMEWORK_MODE_GITIGNORE,
      },
    };

    return framed;
  }

  const page = emitHtmlEntry(unscopedName(name), 'src/main.tsx', FAVICON);
  const framed: Framed = {
    files: [
      {
        path: 'index.html',
        text: page,
      },
      ...files,
    ],
    share: {
      package: {
        scripts: VITE_SCRIPTS,
        devDependencies: versioned([...devDependencies, ...HTML_DEV_DEPENDENCIES]),
      },
      eslint: {
        ...eslint,
        html: true,
      },
      gitignore: VITE_GITIGNORE,
    },
  };

  return framed;
};
