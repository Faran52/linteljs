import {
  type Answers,
  type Artifact,
  type Browser,
  type ProjectShape,
} from '@config/types';

import { browsersOf, hasSurface } from '@utils/answerUtils';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

// Emitted: browsers times surfaces would be twelve templates of one shape. Birth only.

// Chrome MV3 takes a service worker; Firefox MV3 takes an event page.
interface ServiceWorker {
  service_worker: string;
  type: 'module';
}

interface EventPage {
  scripts: string[];
}

// Firefox alone: Chrome rejects `browser_specific_settings` and AMO requires it.
interface Gecko {
  id: string;
  strict_min_version: string;
}

interface GeckoSettings {
  gecko: Gecko;
}

interface BrowserAction {
  default_popup: string;
}

export interface Manifest {
  manifest_version: number;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  host_permissions: string[];
  browser_specific_settings?: GeckoSettings;
  action?: BrowserAction;
  background?: EventPage | ServiceWorker;
  devtools_page?: string;
}

const backgroundFor = (browser: Browser): ServiceWorker | EventPage => {
  return browser === 'firefox'
    ? { scripts: ['src/background/index.ts'] }
    : {
        service_worker: 'src/background/index.ts',
        type: 'module',
      };
};

// A project shipping to both stores emits this twice from one set of answers.
export const emitManifest = (
  answers: Answers,
  projectName: string,
  browser: Browser = answers.browser,
): string | null => {
  if (targetFor(answers).hostsBrowser !== true) {
    return null;
  }

  // Empty on purpose: permissions are the project's security surface.
  const manifest: Manifest = {
    manifest_version: 3,
    name: projectName,
    version: '0.1.0',
    description: `${projectName}, a browser extension.`,
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: `${projectName}@example.com`,
              strict_min_version: '140.0',
            },
          },
        }
      : {}),
    ...(hasSurface(answers, 'popup') ? { action: { default_popup: 'index.html' } } : {}),
    ...(hasSurface(answers, 'background') ? { background: backgroundFor(browser) } : {}),
    // The panel is not named here, so the Vite config gives it an input of its own.
    ...(hasSurface(answers, 'devtools-panel') ? { devtools_page: 'devtools.html' } : {}),
    permissions: [],
    host_permissions: [],
  };

  return `${JSON.stringify(manifest, null, 2)}\n`;
};

export const manifestEmitter = (answers: Answers, _project: ProjectShape, name: string): Artifact[] => {
  return browsersOf(answers)
    .flatMap((browser) => {
      const manifest = emitManifest(answers, name, browser);

      if (manifest === null) {
        return [];
      }

      return [{
        ...emitted(
          'standard',
          browser === answers.browser ? 'manifest.json' : `manifest.${browser}.json`,
          manifest,
        ),
        seed: true,
      } satisfies Artifact];
    });
};
