import { hasSurface } from '@utils/answerUtils';

import { DECLARATION_KEY, FOLDER } from '../constants';
import { hostedNaming, hostedPartsFor } from '../utils/frameworkUtils';
import { mockFiles, mockTests } from '../utils/mockUtils';
import { scriptKeys } from '../utils/namingUtils';

import {
  BROWSERS,
  CRX,
  POPUP,
  SHARED,
  WEBEXTENSION_I18N,
} from './constants';
import { popupI18nFiles, popupI18nTests } from './utils/translatedFileUtils';

import type { Answers, Browser } from '@config/types';
import type { TargetBuilder } from '../registry';
import type { StarterFile, TargetRecord } from '../types';

// The Chrome types declare `chrome.*` and the Firefox ones `browser.*`, so one starter cannot satisfy both.
const surfaceFiles = (answers: Answers, variant: Browser): StarterFile[] => {
  const files: StarterFile[] = [
    ...SHARED
      .map((target): StarterFile => {
        const file: StarterFile = {
          target,
          shared: true,
        };

        return file;
      }),
    {
      target: 'src/styles/theme.css',
      when: (current) => {
        return current.styling === 'tailwind';
      },
      variant: 'tailwind',
      shared: true,
    },
  ];

  if (hasSurface(answers, 'popup')) {
    files.push(
      ...POPUP
        .map((target): StarterFile => {
          const file: StarterFile = { target };

          return file;
        }),
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
        target: 'src/background/index.ts',
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
        target: 'src/devtools/index.ts',
        variant,
      },
      {
        target: 'panel.html',
      },
      {
        target: 'src/panel/index.ts',
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
    ...hasSurface(answers, 'background') ? ['src/background/index.ts'] : [],
    ...hasSurface(answers, 'devtools-panel')
      ? ['src/devtools/index.ts', 'src/panel/index.ts']
      : [],
  ];

  return coverageExclude;
};

export const webextensionTarget: TargetBuilder = (answers) => {
  const popup = hasSurface(answers, 'popup');
  const browser = BROWSERS[answers.browser];
  const hosted = hostedPartsFor(answers.hostedFramework);

  const record: TargetRecord = {
    id: 'webextension',
    htmlEntry: popup ? 'src/main.ts' : undefined,
    hostsBrowser: true,
    hostsFramework: true,
    html: popup || hasSurface(answers, 'devtools-panel'),
    ignores: [],
    naming: hosted === undefined
      ? {
          'src/components/**/!(*.d|*.test|*.spec).ts': 'PASCAL_CASE',
          ...scriptKeys('components'),
          ...DECLARATION_KEY,
        }
      : hostedNaming(hosted.framework),
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
    ...(hosted === undefined ? {} : { framework: hosted.framework }),
    ...(hosted?.sfcExtension === undefined ? {} : { sfcExtension: hosted.sfcExtension }),
    // `crx` wraps whatever the plugins before it produced.
    vitePlugin: {
      imports: [...hosted?.vitePlugin.imports ?? [], ...CRX.imports],
      calls: [...hosted?.vitePlugin.calls ?? [], ...CRX.calls],
    },
    // Without the hosted framework's JSX settings every `.tsx` fails: measured at 213 TS17004 and 245 TS7026.
    tsconfig: {
      types: browser.types,
      ...(hosted?.jsx === undefined ? {} : { jsx: hosted.jsx }),
      ...(hosted?.jsxImportSource === undefined ? {} : { jsxImportSource: hosted.jsxImportSource }),
    },
    ...(hosted?.testConditions === undefined ? {} : { testConditions: hosted.testConditions }),
    starterFiles: [...mockFiles(false), ...surfaceFiles(answers, answers.browser)],
    starterTests: [
      ...mockTests(false),
      ...popup ? popupI18nTests() : [],
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
    ],
    coverageExclude: surfaceCoverageExclude(answers),
    // crx builds only pages the manifest names; the panel is opened at runtime.
    ...(hasSurface(answers, 'devtools-panel') ? { viteInputs: { panel: 'panel.html' } } : {}),
    typecheck: 'tsc --noEmit',
    build: 'vite build',
    extraScripts: {
      dev: 'vite',
      preview: 'vite preview',
    },
    ...(hosted === undefined ? {} : { dependencies: hosted.dependencies }),
    devDependencies: [
      '@crxjs/vite-plugin',
      'vite',
      ...browser.devDependencies,
      ...hosted?.devDependencies ?? [],
    ],
    ...(hosted === undefined ? {} : { testDevDependencies: hosted.testDevDependencies }),
    allowBuilds: [...hosted?.allowBuilds ?? []],
    stateRules: hosted?.stateRules ?? [],
    ...(popup ? { i18n: WEBEXTENSION_I18N } : {}),
  };

  return record;
};
