import { LANGUAGES } from '@config/constants';

import { unscopedName } from '@utils/nameUtils';

import { answeredValues } from '@choices/utils/drawerUtils';
import { HTML_DEV_DEPENDENCIES } from '@emitters/constants';
import { emitI18nConfig } from '@emitters/libraries/i18n-config/i18nConfigEmitter';
import { FAVICON } from '@emitters/target/html-entry/constants';
import { emitHtmlEntry } from '@emitters/target/html-entry/htmlEntryEmitter';
import { versioned } from '@emitters/utils/packageJsonUtils';
import { FOLDER_ROUTED } from '@targets';
import { PARTS } from '@targets/constants';
import { componentNaming } from '@targets/utils/namingUtils';

import {
  FRAMEWORK_MODE_LEAVES,
  FRAMEWORK_MODE_TYPECHECK,
  IGNORES,
  VITE_SCRIPTS,
} from './constants';

import type {
  Framed,
  FrameworkModule,
  Generated,
} from '../types';

// React's own share and files over its drawers; React Router's framework mode brings its own scripts and document.
export const reactFramework: FrameworkModule = (name, answers) => {
  const picked = answeredValues(answers, 'languages');
  const languages = picked
    .flatMap((value) => {
      return LANGUAGES
        .filter((language) => {
          return language === value;
        });
    });
  const i18nConfig: Generated = {
    path: 'src/i18n/config.ts',
    text: emitI18nConfig(languages),
  };
  const eslint = {
    framework: 'react',
    typescript: true,
    ignores: IGNORES,
    naming: componentNaming(),
    folderNaming: { 'src/**/': FOLDER_ROUTED },
  };
  const devDependencies = [
    ...PARTS.react.devDependencies,
    'vite',
    'typescript',
  ];

  if (answers.router === 'react-router-framework') {
    const kept = devDependencies
      .filter((dependency) => {
        return dependency !== FRAMEWORK_MODE_LEAVES;
      });
    const framed: Framed = {
      files: [i18nConfig],
      share: {
        package: {
          scripts: { typecheck: FRAMEWORK_MODE_TYPECHECK },
          devDependencies: versioned(kept),
        },
        eslint,
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
      i18nConfig,
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
    },
  };

  return framed;
};
