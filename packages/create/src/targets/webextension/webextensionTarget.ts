import { hasSurface } from '@utils/answerUtils';

import { FOLDER, VITE_GITIGNORE } from '../constants';
import { hostedPartsFor } from '../utils/frameworkUtils';
import { mockFiles, mockTests } from '../utils/mockUtils';
import { filesAt } from '../utils/starterUtils';
import { tailwindThemeFile } from '../utils/styleUtils';

import {
  BROWSERS,
  POPUP,
  SHARED,
  WEBEXTENSION_I18N,
} from './constants';
import { hostedRecordParts } from './utils/hostedRecordUtils';
import { popupI18nFiles, popupI18nTests } from './utils/translatedFileUtils';

import type { Answers, Browser } from '@config/types';
import type { TargetBuilder } from '../registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '../types';

// The Chrome types declare `chrome.*` and the Firefox ones `browser.*`, so one starter cannot satisfy both.
const surfaceFiles = (answers: Answers, variant: Browser): StarterFile[] => {
  const files: StarterFile[] = [
    ...filesAt(SHARED, {
      shared: true,
    }),
    tailwindThemeFile(),
  ];

  if (hasSurface(answers, 'popup')) {
    files.push(
      ...filesAt(POPUP),
      ...popupI18nFiles(),
      // No components here, so a stylesheet under `components/` would sit beside nothing.
      {
        target: 'src/lib/mark/mark.css',
        source: 'src/components/ui/mark/Mark.css',
        shared: true,
      },
    );
  }

  if (hasSurface(answers, 'background')) {
    // `manifest.json` names the entry, so it must exist before the first `vite build`.
    files.push(
      {
        target: 'src/background/background.ts',
        variant,
      },
      {
        target: 'src/background/onInstalled.ts',
        variant,
      },
    );
  }

  if (hasSurface(answers, 'devtools-panel')) {
    files.push(
      // The entry HTML stays at the root, where manifest paths resolve.
      {
        target: 'devtools.html',
      },
      {
        target: 'src/devtools/devtools.ts',
        variant,
      },
      {
        target: 'panel.html',
      },
      {
        target: 'src/panel/panel.ts',
      },
      {
        target: 'src/panel/renderPanel.ts',
      },
    );
  }

  return files;
};

const surfaceCoverageExclude = (answers: Answers): string[] => {
  const coverageExclude: string[] = [
    // Only the popup reads the record, so without it nothing a suite runs imports the module.
    ...hasSurface(answers, 'popup') ? [] : ['src/config/linteljs.ts'],
    ...hasSurface(answers, 'background') ? ['src/background/background.ts'] : [],
    ...hasSurface(answers, 'devtools-panel')
      ? ['src/devtools/devtools.ts', 'src/panel/panel.ts']
      : [],
  ];

  return coverageExclude;
};

const surfaceTests = (answers: Answers): StarterTest[] => {
  const tests: StarterTest[] = [
    ...hasSurface(answers, 'popup') ? popupI18nTests() : [],
    ...hasSurface(answers, 'background')
      ? [{
          variant: answers.browser,
          target: 'src/background/onInstalled.test.ts',
          covers: 'src/background/onInstalled.ts',
        }]
      : [],
    ...hasSurface(answers, 'devtools-panel')
      ? [{
          target: 'src/panel/renderPanel.test.ts',
          covers: 'src/panel/renderPanel.ts',
        }]
      : [],
  ];

  return tests;
};

export const webextensionTarget: TargetBuilder = (answers) => {
  const popup = hasSurface(answers, 'popup');
  const devtools = hasSurface(answers, 'devtools-panel');
  const hosted = hostedRecordParts(hostedPartsFor(answers.hostedFramework), BROWSERS[answers.browser]);

  const record: TargetRecord = {
    id: 'webextension',
    htmlEntry: popup ? 'src/main.ts' : undefined,
    hostsBrowser: true,
    hostsFramework: true,
    html: popup || devtools,
    ignores: [],
    gitignore: VITE_GITIGNORE,
    folderNaming: { 'src/**/': FOLDER },
    // `@store/*` would name a directory this layout lacks.
    extraAliases: { '@model/*': './src/lib/model/*' },
    omitAliases: ['@store/*'],
    styleEntry: 'src/style.css',
    // Beside its markup: the mark is a string in `lib/`.
    starterStyles: [
      './styles/tokens.css',
      './styles/base.css',
      ...popup ? ['./lib/mark/mark.css'] : [],
    ],
    tailwindTheme: './styles/theme.css',
    ...hosted,
    starterFiles: [...mockFiles(), ...surfaceFiles(answers, answers.browser)],
    starterTests: [...mockTests(), ...surfaceTests(answers)],
    coverageExclude: surfaceCoverageExclude(answers),
    // crx builds only pages the manifest names; the panel is opened at runtime.
    ...(devtools ? { viteInputs: { panel: 'panel.html' } } : {}),
    typecheck: 'tsc --noEmit',
    build: 'vite build',
    extraScripts: {
      dev: 'vite',
      preview: 'vite preview',
    },
    ...(popup ? { i18n: WEBEXTENSION_I18N } : {}),
  };

  return record;
};
