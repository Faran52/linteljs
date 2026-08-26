import {
  type Answers,
  type Browser,
  hasSurface,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

/**
 * `manifest.json` for the extension target, and nothing for the other eight.
 *
 * Emitted rather than copied from a template. Two axes reach it, the browser and the surface list, and a file per
 * combination would be twelve templates holding one shape between them. The browser decides how a background entry is
 * spelled and whether Gecko settings appear; the surfaces decide which entries exist at all.
 *
 * Written at birth only. A real extension's manifest is its permissions, its icons and its store metadata within a
 * week, so this is a starting point that `sync` never touches again.
 */

// Chrome MV3 takes a service worker; Firefox MV3 takes an event page, which is a script list. Same surface, two
// spellings, which is why the browser reaches this file at all.
interface ServiceWorker {
  service_worker: string;
  type: 'module';
}

interface EventPage {
  scripts: string[];
}

/**
 * The fields this emitter writes, which is a starting point rather than the whole of MV3: a real extension adds icons,
 * permissions and store metadata to its own copy. Declared here because this file owns the shape, so a reader of the
 * emitted file has one place to check it against.
 */
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

// The read half, for a caller holding emitted text. Mirrors `parsePackageJson`, for the same reason: a guard beats a
// cast, and the throw says which file was not what it claimed.
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

/**
 * `browser` is a parameter rather than being read off the answers, because a project shipping to both stores emits
 * this twice from one set of answers. The two differ only in `browser_specific_settings`, which Chrome rejects and
 * AMO requires, and in the background shape; everything else is one manifest written twice.
 */
export const emitManifest = (
  answers: Answers,
  projectName: string,
  browser: Browser = answers.browser,
): string | null => {
  if (targetFor(answers).hostsBrowser !== true) {
    return null;
  }

  // `permissions` and `host_permissions` ship empty on purpose: they are the project's security surface, and a template
  // guessing at them is how an extension ends up asking for more than it uses.
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
    /**
     * The devtools page, not the panel. Chrome and Firefox both open this page invisibly when devtools opens, and its
     * only job is to call `devtools.panels.create` with the panel's own page. crx builds a page the manifest names;
     * the panel is not named here, so the Vite config gives it an input of its own.
     */
    ...(hasSurface(answers, 'devtools-panel') ? { devtools_page: 'devtools.html' } : {}),
    permissions: [],
    host_permissions: [],
  };

  return `${JSON.stringify(manifest, null, 2)}\n`;
};
