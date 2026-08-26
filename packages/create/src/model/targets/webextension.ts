import { hasSurface } from '../answers/answers';
import { FOLDER_NAMING, NAMING } from '../naming/naming';

import { hostedNaming, partsFor } from './utils/frameworkUtils';
import { viteScaffold } from './utils/targetUtils';

import type { Answers, Browser } from '../answers/answers';
import type { PluginSpec, StarterFile } from './record';
import type { TargetBuilder } from './registry';

/**
 * A Manifest V3 extension on the vanilla TypeScript scaffold, with no official generator of its own; stage 4 adds the
 * manifest, the surfaces it names, and `@crxjs/vite-plugin` to build them.
 *
 * Two axes move this record. The browser decides the manifest shape and the ambient types, not the bundler: `crx`
 * builds for both, and its own manifest type carries the `service_worker` and the `scripts` background forms plus
 * `browser_specific_settings.gecko`. The hosted framework decides what a component is, which Vite plugin runs and
 * which layer lints it, leaving the manifest and the surface layout alone.
 */

// Per browser: the ambient types, the manifest template, and what runs and packages the build.
interface BrowserParts {
  types: string[];
  devDependencies: string[];
  // A way to run the built extension, where the browser has a runner for it.
  scripts?: Record<string, string>;
  /**
   * The background entry and its handler, in the namespace this browser's own types declare. Not shared: the Chrome
   * types declare `chrome.*` and the Firefox ones `browser.*`, so one file cannot satisfy both. Found by an end-to-end
   * run, where the Firefox starter linted as three unsafe-member-access findings on an untyped `chrome`. The handler's
   * own test comes with it: the two details types are not the same shape either, Firefox's carrying a required
   * `temporary`, so an object literal written for one fails `typecheck` against the other.
   */
  starter: {
    entry: string;
    handler: string;
    test: string;
    // The devtools page's registration call, which names a namespace for the same reason the background entry does.
    devtools: string;
  };
}

const BROWSERS: Record<Browser, BrowserParts> = {
  chrome: {
    // Both shipped rule files assume `chrome.*`, and without the types the first line of extension code fails
    // `typecheck`. An allow-list once populated: installed but unlisted still lints `chrome.*` as unresolved.
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
    // Firefox implements the same surface under `browser.*`, promise-returning rather than callback-taking. These types
    // declare that namespace and only that one: they carry no `chrome`, so Chrome's starter does not typecheck here.
    types: ['firefox-webext-browser'],
    // `web-ext` runs the extension in a real Firefox, lints the manifest the way AMO will, and builds the upload
    // archive. It is not a bundler, so `crx` still is.
    devDependencies: ['@types/firefox-webext-browser', 'web-ext'],
    // `--no-reload` because the build is a one-shot `vite build`, not a watch: a reload would serve a stale `dist/`.
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

/**
 * What each surface contributes. A surface is not a file list alone: it decides what the manifest names, which the
 * manifest emitter reads from the same answer, and whether the build needs an input the manifest does not give it.
 *
 * `popup` contributes nothing here. Its page is `index.html` and its entry `src/main.ts`, both of which the Vite
 * scaffold already wrote, and the manifest points `action.default_popup` at the first.
 */
const surfaceFiles = (answers: Answers, browser: BrowserParts): StarterFile[] => {
  const files: StarterFile[] = [];

  if (hasSurface(answers, 'background')) {
    // `manifest.json` names the entry, so it must exist before the first `vite build`, and no vanilla scaffold
    // writes one. The handler lives beside it and is covered like any other module.
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
      // Two folders, not one: `repo-structure.webextension.md` gives the devtools page and the panel a folder each,
      // and the entry HTML stays flat at the root because the browser resolves manifest paths against it.
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

// Entry shells: a registration call with no branch of its own, which is the case `src/{main,index}` is excluded for.
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
    // Nothing of its own: `dist/**` is a shared ignore, and it was repeated here until a duplicate was noticed
    // in the emitted config.
    ignores: [],
    // With a framework, the component is marked by its own extension; without one, by living under `components/`.
    naming: hosted === undefined ? NAMING.webextension : hostedNaming(hosted.framework),
    // No router, so no segment a kebab-case folder rule has to make room for.
    folderNaming: FOLDER_NAMING.webextension,
    // `lib/model/` is this target's own layout with no alias; `@store/*` aliases a directory this layout doesn't
    // have, an alias naming nothing being a dead end a reader follows for no reason.
    extraAliases: { '@model/*': './src/lib/model/*' },
    omitAliases: ['@store/*'],
    styleEntry: 'src/style.css',
    ...(hosted === undefined ? {} : { framework: hosted.framework }),
    ...(hosted?.sfcExtension === undefined ? {} : { sfcExtension: hosted.sfcExtension }),
    // The framework plugin runs before `crx`, which reads the manifest and wraps whatever the plugins above produced.
    vitePlugin: {
      imports: [...hosted?.vitePlugin.imports ?? [], ...CRX.imports],
      calls: [...hosted?.vitePlugin.calls ?? [], ...CRX.calls],
    },
    /**
     * The hosted framework's JSX settings, which a host with no framework has none of. Without them every `.tsx` file
     * in the project fails to compile: a real migration hit 213 `TS17004` and 245 `TS7026`, because the axis wired the
     * Vite plugin and the dependencies and then never told TypeScript what the templates were.
     */
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
    /**
     * crx builds every page the manifest names, and the panel is not one: a devtools page opens it at runtime through
     * `devtools.panels.create`. Verified against the crx docs, which say an extra page goes in
     * `build.rollupOptions.input`.
     */
    ...(hasSurface(answers, 'devtools-panel') ? { viteInputs: { panel: 'panel.html' } } : {}),
    typecheck: 'tsc --noEmit',
    ...(browser.scripts === undefined ? {} : { extraScripts: browser.scripts }),
    ...(hosted === undefined ? {} : { dependencies: hosted.dependencies }),
    devDependencies: [
      '@crxjs/vite-plugin',
      ...browser.devDependencies,
      ...hosted?.devDependencies ?? [],
    ],
    ...(hosted === undefined ? {} : { testDevDependencies: hosted.testDevDependencies }),
    allowBuilds: hosted?.allowBuilds ?? [],
    stateRules: hosted?.stateRules ?? [],
  };
};
