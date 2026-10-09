import { unscopedName } from '@utils/nameUtils';

import { HTML_DEV_DEPENDENCIES } from '@emitters/constants';
import { FAVICON } from '@emitters/target/html-entry/constants';
import { emitHtmlEntry } from '@emitters/target/html-entry/htmlEntryEmitter';
import { versioned } from '@emitters/utils/packageJsonUtils';
import { FOLDER_ROUTED } from '@targets';
import { PARTS } from '@targets/constants';
import { componentNaming } from '@targets/utils/namingUtils';

import {
  FRAMEWORK_MODE_LEAVES,
  IGNORES,
  VITE_SCRIPTS,
} from './constants';

import type { Framed, FrameworkModule } from '../types';

// React's own share and files over its drawers; React Router's framework mode brings its own scripts and document.
export const reactFramework: FrameworkModule = (name, answers) => {
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
      files: [],
      share: {
        package: { devDependencies: versioned(kept) },
        eslint,
      },
    };

    return framed;
  }

  const page = emitHtmlEntry(unscopedName(name), 'src/main.tsx', FAVICON);
  const framed: Framed = {
    files: [{
      path: 'index.html',
      text: page,
    }],
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
