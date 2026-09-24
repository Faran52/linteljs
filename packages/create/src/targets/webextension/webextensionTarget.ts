import { hasSurface } from '#answers/utils/answerUtils';

import { DECLARATION_KEY, FOLDER } from '../constants';
import { hostedNaming, partsFor } from '../utils/frameworkUtils';
import { mockFiles, mockTests } from '../utils/mockUtils';
import { scriptKeys } from '../utils/namingUtils';

import {
  BROWSERS,
  CRX,
  POPUP,
  SHARED,
} from './constants';

import type { Answers } from '#answers/registry';
import type { Browser } from '#answers/target/browser/browserAnswer';
import type { TargetBuilder } from '../registry';
import type { StarterFile } from '../types';

// Manifest V3 on the vanilla scaffold, built by `@crxjs/vite-plugin`. The browser decides the manifest shape and the
// ambient types; the hosted framework decides what a component is and which plugin and layer handle it.

/**
 * Per browser: the Chrome types declare `chrome.*` and the Firefox ones `browser.*`, so one starter cannot satisfy
 * both. Measured: the Firefox starter linted as three unsafe-member-access findings on an untyped `chrome`.
 *
 * Which four files those are is not listed here. Both browsers fill the same four destinations and the asset for
 * each sits under a directory named for the browser, so `variant` on the entry is the whole of the difference.
 */
// A surface decides what the manifest names and whether the build needs an input the manifest does not give it.
const surfaceFiles = (answers: Answers, variant: Browser): StarterFile[] => {
  const files: StarterFile[] = [
    ...POPUP.map((target): StarterFile => {
      return { target };
    }),
    ...SHARED.map((target): StarterFile => {
      return {
        target,
        shared: true,
      };
    }),
    {
      target: 'src/styles/theme.css',
      when: (current) => {
        return current.styling === 'tailwind';
      },
      variant: 'tailwind',
      shared: true,
    },
    /*
     * The same bytes every other target's mark and button take, at the path this one puts them: there are no
     * components here, so a stylesheet under `components/` would sit beside nothing. The popup always has a
     * button, so neither is conditional.
     */
    {
      target: 'src/lib/mark.css',
      source: 'src/components/ui/mark/Mark.css',
      shared: true,
    },
    {
      target: 'src/popup/button.css',
      source: 'src/components/ui/button/Button.css',
      shared: true,
    },
  ];

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
      // A folder each for the devtools page and the panel; the entry HTML stays at the root, where manifest paths
      // resolve.
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

// Entry shells with no branch of their own, excluded like `src/{main,index}`.
const surfaceCoverageExclude = (answers: Answers): string[] => {
  return [
    ...hasSurface(answers, 'background') ? ['src/background/index.ts'] : [],
    ...hasSurface(answers, 'devtools-panel')
      ? ['src/devtools/index.ts', 'src/panel/index.ts']
      : [],
  ];
};

export const webextensionTarget: TargetBuilder = (answers) => {
  const browser = BROWSERS[answers.browser];
  const hosted = answers.hostedFramework === undefined
    ? undefined
    : partsFor(answers.hostedFramework);

  return {
    id: 'webextension',
    recordModule: 'src/config/linteljs.ts',
    htmlEntry: 'src/main.ts',
    hostsBrowser: true,
    hostsFramework: true,
    html: true,
    vite: true,
    routeUnit: 'manifest.json, whose entries name every surface',
    ignores: [],
    // With a framework the component is marked by its extension; without one, by living under `components/`: a
    // component is marked by directory rather than by a `.tsx` extension.
    naming: hosted === undefined
      ? {
          'src/components/**/!(*.d|*.test|*.spec).ts': 'PASCAL_CASE',
          ...scriptKeys('components'),
          ...DECLARATION_KEY,
        }
      : hostedNaming(hosted.framework),
    folderNaming: { 'src/**/': FOLDER },
    // `lib/model/` has no alias, and `@store/*` would name a directory this layout lacks.
    extraAliases: { '@model/*': './src/lib/model/*' },
    omitAliases: ['@store/*'],
    styleEntry: 'src/style.css',
    /*
     * Beside the markup that uses them rather than under `components/`, which this target has none of: the mark
     * is a string in `lib/` and the popup builds its button node by node. That is also what keeps them under
     * StyleX, where the style entry drops a component's stylesheet because a `styles.ts` replaces it.
     */
    starterStyles: [
      './styles/tokens.css',
      './styles/base.css',
      './lib/mark.css',
      './popup/button.css',
    ],
    tailwindTheme: './styles/theme.css',
    ...(hosted === undefined ? {} : { framework: hosted.framework }),
    ...(hosted?.sfcExtension === undefined ? {} : { sfcExtension: hosted.sfcExtension }),
    // The framework plugin runs before `crx`, which wraps whatever the plugins above produced.
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
    starterFiles: [...mockFiles(), ...surfaceFiles(answers, answers.browser)],
    starterTests: [
      ...mockTests(),
      {
        target: 'src/counter.test.ts',
        covers: 'src/counter.ts',
      },
      {
        target: 'src/popup/renderPopup.test.ts',
        covers: 'src/popup/renderPopup.ts',
      },
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
    // crx builds only pages the manifest names; the panel is opened at runtime, so it goes in `rollupOptions.input`.
    ...(hasSurface(answers, 'devtools-panel') ? { viteInputs: { panel: 'panel.html' } } : {}),
    typecheck: 'tsc --noEmit',
    // The three a scaffolder used to write.
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
  };
};
