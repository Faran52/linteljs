import { hasSurface } from '../answers/answers';
import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { hostedNaming, partsFor } from './utils/frameworkUtils';
import { viteScaffold } from './utils/targetUtils';

import type { Answers, Browser } from '../answers/answers';
import type { PluginSpec, StarterFile } from './record';
import type { TargetBuilder } from './registry';

// Manifest V3 on the vanilla scaffold, built by `@crxjs/vite-plugin`. The browser decides the manifest shape and the
// ambient types; the hosted framework decides what a component is and which plugin and layer handle it.

interface BrowserParts {
  types: string[];
  devDependencies: string[];
  scripts?: Record<string, string>;
  // Per browser: the Chrome types declare `chrome.*` and the Firefox ones `browser.*`, so one starter cannot satisfy
  // both. Measured: the Firefox starter linted as three unsafe-member-access findings on an untyped `chrome`.
  starter: {
    entry: string;
    handler: string;
    test: string;
    devtools: string;
  };
}

const BROWSERS: Record<Browser, BrowserParts> = {
  chrome: {
    // Without the types the first line of extension code fails `typecheck`; once listed, `types` is an allow-list.
    types: ['chrome'],
    devDependencies: ['@types/chrome'],
    starter: {
      entry: 'starter/webextension/background.ts',
      handler: 'starter/webextension/onInstalled.ts',
      test: 'starter/webextension/onInstalled.test.ts',
      devtools: 'starter/webextension/devtools.ts',
    },
  },
  firefox: {
    // `browser.*`, promise-returning; these types carry no `chrome`, so Chrome's starter does not typecheck here.
    types: ['firefox-webext-browser'],
    // `web-ext` runs, lints and packages; it is not a bundler, so `crx` still is.
    devDependencies: ['@types/firefox-webext-browser', 'web-ext'],
    // `--no-reload`: the build is a one-shot `vite build`, so a reload would serve a stale `dist/`.
    scripts: { start: 'web-ext run --source-dir dist --no-reload' },
    starter: {
      entry: 'starter/webextension/background.firefox.ts',
      handler: 'starter/webextension/onInstalled.firefox.ts',
      test: 'starter/webextension/onInstalled.firefox.test.ts',
      devtools: 'starter/webextension/devtools.firefox.ts',
    },
  },
};

const CRX: PluginSpec = {
  imports: [
    "import { crx } from '@crxjs/vite-plugin';",
    "import manifest from './manifest.json';",
  ],
  calls: ['crx({ manifest })'],
};

// A surface decides what the manifest names and whether the build needs an input the manifest does not give it.
// `popup` contributes nothing: the Vite scaffold already wrote `index.html` and `src/main.ts`.
const surfaceFiles = (answers: Answers, browser: BrowserParts): StarterFile[] => {
  const files: StarterFile[] = [];

  if (hasSurface(answers, 'background')) {
    // `manifest.json` names the entry, so it must exist before the first `vite build`.
    files.push(
      {
        source: browser.starter.entry,
        target: 'src/background/index.ts',
      },
      {
        source: browser.starter.handler,
        target: 'src/background/onInstalled.ts',
      },
    );
  }

  if (hasSurface(answers, 'devtools-panel')) {
    files.push(
      // A folder each for the devtools page and the panel; the entry HTML stays at the root, where manifest paths
      // resolve.
      {
        source: 'starter/webextension/devtools.html',
        target: 'devtools.html',
      },
      {
        source: browser.starter.devtools,
        target: 'src/devtools/index.ts',
      },
      {
        source: 'starter/webextension/panel.html',
        target: 'panel.html',
      },
      {
        source: 'starter/webextension/panelEntry.ts',
        target: 'src/panel/index.ts',
      },
      {
        source: 'starter/webextension/renderPanel.ts',
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

export const webextension: TargetBuilder = (answers) => {
  const browser = BROWSERS[answers.browser];
  const hosted = answers.hostedFramework === undefined
    ? undefined
    : partsFor(answers.hostedFramework);

  return {
    id: 'webextension',
    label: 'Web Extension (MV3)',
    scaffold: viteScaffold('vanilla'),
    hostsBrowser: true,
    hostsFramework: true,
    html: true,
    vite: true,
    routeUnit: 'manifest.json, whose entries name every surface',
    ignores: [],
    // With a framework the component is marked by its extension; without one, by living under `components/`.
    naming: hosted === undefined ? NAMING.webextension : hostedNaming(hosted.framework),
    folderNaming: FOLDER_NAMING.webextension,
    // `lib/model/` has no alias, and `@store/*` would name a directory this layout lacks.
    extraAliases: { '@model/*': './src/lib/model/*' },
    omitAliases: ['@store/*'],
    styleEntry: 'src/style.css',
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
    starterFiles: surfaceFiles(answers, browser),
    starterTests: [
      {
        source: 'starter/webextension/counter.test.ts',
        target: 'src/counter.test.ts',
        covers: 'src/counter.ts',
      },
      ...hasSurface(answers, 'background')
        ? [{
            source: browser.starter.test,
            target: 'src/background/onInstalled.test.ts',
            covers: 'src/background/onInstalled.ts',
          }]
        : [],
      ...hasSurface(answers, 'devtools-panel')
        ? [{
            source: 'starter/webextension/renderPanel.test.ts',
            target: 'src/panel/renderPanel.test.ts',
            covers: 'src/panel/renderPanel.ts',
          }]
        : [],
    ],
    starterFixes: [
      {
        path: 'src/counter.ts',
        transform: (source) => {
          // restrict-template-expressions: interpolating a number relies on implicit coercion.
          return source.replace('${counter}', '${String(counter)}');
        },
      },
    ],
    coverageExclude: surfaceCoverageExclude(answers),
    // crx builds only pages the manifest names; the panel is opened at runtime, so it goes in `rollupOptions.input`.
    ...(hasSurface(answers, 'devtools-panel') ? { viteInputs: { panel: 'panel.html' } } : {}),
    typecheck: 'tsc --noEmit',
    ...(browser.scripts === undefined ? {} : { extraScripts: browser.scripts }),
    ...(hosted === undefined ? {} : { dependencies: hosted.dependencies }),
    devDependencies: [
      '@crxjs/vite-plugin',
      'vite',
      ...browser.devDependencies,
      ...hosted?.devDependencies ?? [],
    ],
    ...(hosted === undefined ? {} : { testDevDependencies: hosted.testDevDependencies }),
    allowBuilds: [],
    stateRules: hosted?.stateRules ?? [],
  };
};
