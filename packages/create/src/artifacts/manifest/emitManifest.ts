import {
  type Answers,
  type Browser,
  hasSurface,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

// Emitted rather than templated: browser times surfaces would be twelve templates holding one shape. Birth only,
// since a real manifest is its permissions and store metadata within a week.

// Chrome MV3 takes a service worker; Firefox MV3 takes an event page.
interface ServiceWorker {
  service_worker: string;
  type: 'module';
}

interface EventPage {
  scripts: string[];
}

// A starting point, not the whole of MV3.
export interface Manifest {
  manifest_version: number;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  host_permissions: string[];
  browser_specific_settings?: { gecko: { id: string;
    strict_min_version: string; }; };
  action?: { default_popup: string };
  background?: EventPage | ServiceWorker;
  devtools_page?: string;
}

const isManifest = (value: unknown): value is Manifest => {
  return typeof value === 'object' && value !== null && 'manifest_version' in value;
};

// The read half; a guard beats a cast, and the throw names the file.
export const parseManifest = (text: string): Manifest => {
  const parsed: unknown = JSON.parse(text);

  if (!isManifest(parsed)) {
    throw new Error('manifest.json does not contain a JSON object');
  }

  return parsed;
};

const backgroundFor = (browser: Browser): ServiceWorker | EventPage => {
  return browser === 'firefox'
    ? { scripts: ['src/background/index.ts'] }
    : {
        service_worker: 'src/background/index.ts',
        type: 'module',
      };
};

// `browser` is a parameter: a project shipping to both stores emits this twice from one set of answers.
export const emitManifest = (
  answers: Answers,
  projectName: string,
  browser: Browser = answers.browser,
): string | null => {
  if (targetFor(answers).hostsBrowser !== true) {
    return null;
  }

  // Empty on purpose: permissions are the project's security surface, not a template's guess.
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
    // The devtools page, whose only job is `devtools.panels.create`; the panel is not named here, so the Vite
    // config gives it an input of its own.
    ...(hasSurface(answers, 'devtools-panel') ? { devtools_page: 'devtools.html' } : {}),
    permissions: [],
    host_permissions: [],
  };

  return `${JSON.stringify(manifest, null, 2)}\n`;
};
