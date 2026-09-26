import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import {
  type Answers,
  type Browser,
  type Data,
  DEFAULT_ANSWERS,
  type Styling,
  type Surface,
} from '@answers';

import { starterSourceEmitter } from '../starter-source/starterSourceEmitter';

import {
  emitManifest,
  type Manifest,
  manifestEmitter,
  parseManifest,
} from './manifestEmitter';

interface AnswerOverrides {
  browser?: Answers['browser'];
  browsers?: Browser[];
  surfaces?: Surface[];
  target?: Answers['target'];
  styling?: Styling;
  data?: Data;
}

const answersFor = (overrides: AnswerOverrides = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    target: 'webextension',
    ...overrides,
  };
};

const manifestFor = (overrides: AnswerOverrides = {}): Manifest => {
  const emitted = emitManifest(answersFor(overrides), 'demo-app');

  if (emitted === null) {
    throw new Error('expected a manifest');
  }

  return parseManifest(emitted);
};

describe('emitManifest', () => {
  // The same shape the other emitters use for a target the file does not belong to.
  it('writes nothing for a target that is not an extension', () => {
    expect(emitManifest(answersFor({ target: 'react' }), 'demo-app')).toBeNull();
    expect(emitManifest(answersFor({ target: 'astro' }), 'demo-app')).toBeNull();
  });

  // The permissions are the project's own security surface: a template guessing at them is how an extension over-asks.
  it('names the project and ships an empty permission surface', () => {
    expect(manifestFor()).toStrictEqual({
      manifest_version: 3,
      name: 'demo-app',
      version: '0.1.0',
      description: 'demo-app, a browser extension.',
      action: { default_popup: 'index.html' },
      background: {
        service_worker: 'src/background/index.ts',
        type: 'module',
      },
      permissions: [],
      host_permissions: [],
    });
  });

  /**
   * The default is the popup and background pair, which is what this target wrote before surfaces existed, so an older
   * `linteljs.config.json` still describes the extension it generated.
   */
  it('defaults to a popup and a background entry', () => {
    const manifest = manifestFor();

    expect(manifest.action).toEqual({ default_popup: 'index.html' });
    expect(manifest.background).toEqual({
      service_worker: 'src/background/index.ts',
      type: 'module',
    });
    expect(manifest.devtools_page).toBeUndefined();
  });

  // Chrome takes a service worker, Firefox an event page. One surface, two spellings.
  it('spells the background entry the way the browser expects', () => {
    expect(manifestFor({ browser: 'chrome' }).background)
      .toEqual({
        service_worker: 'src/background/index.ts',
        type: 'module',
      });
    expect(manifestFor({ browser: 'firefox' }).background)
      .toEqual({ scripts: ['src/background/index.ts'] });
  });

  it('carries gecko settings on firefox and not on chrome', () => {
    expect(manifestFor({ browser: 'firefox' }).browser_specific_settings).toEqual({
      gecko: {
        id: 'demo-app@example.com',
        strict_min_version: '140.0',
      },
    });
    expect(manifestFor({ browser: 'chrome' }).browser_specific_settings).toBeUndefined();
  });

  /**
   * A surface the manifest does not name does not exist, which is the whole point of the axis: a devtools-only
   * extension should not declare a popup it has no page for, or a background entry it ships no file for.
   */
  it('names only the surfaces that were answered', () => {
    const manifest = manifestFor({ surfaces: ['devtools-panel'] });

    expect(manifest.devtools_page).toBe('devtools.html');
    expect(manifest.action).toBeUndefined();
    expect(manifest.background).toBeUndefined();
  });

  it('names all three where all three were answered', () => {
    const manifest = manifestFor({ surfaces: ['popup', 'background', 'devtools-panel'] });

    expect(manifest.action).toBeDefined();
    expect(manifest.background).toBeDefined();
    expect(manifest.devtools_page).toBe('devtools.html');
  });

  // The read half, whose throw is the only way a caller learns the file was not what it claimed.
  it.each(['[]', '{}'])('refuses %s, which is not a manifest object', (text) => {
    expect(() => {
      return parseManifest(text);
    }).toThrow('manifest.json does not contain a JSON object');
  });

  // Read by a person and committed to a repository, so it is indented and ends in a newline like every other artifact.
  it('emits formatted json ending in a newline', () => {
    const emitted = emitManifest(answersFor(), 'demo-app');

    expect(emitted?.endsWith('}\n')).toBe(true);
    expect(emitted).toContain('\n  "manifest_version": 3,');
  });
});

describe('manifestEmitter', () => {
  const manifestsFor = (overrides: AnswerOverrides): Record<string, Manifest> => {
    return Object.fromEntries(manifestEmitter(answersFor(overrides), EMPTY_PROJECT, 'demo-app').map((artifact) => {
      return [artifact.target, parseManifest('text' in artifact.content ? artifact.content.text : '')];
    }));
  };

  // Birth only: a manifest's permissions and store metadata are the project's to keep.
  it('plants one manifest, named for the project, on a project being born', () => {
    const artifacts = manifestEmitter(answersFor(), EMPTY_PROJECT, 'demo-app');

    expect(artifacts.map(({
      stage,
      target,
      seed,
    }) => {
      return [stage, target, seed];
    })).toEqual([['standard', 'manifest.json', true]]);
    expect(manifestsFor({})['manifest.json']?.name).toBe('demo-app');
  });

  it('writes none for a target that hosts no browser', () => {
    expect(manifestEmitter({
      ...DEFAULT_ANSWERS,
      target: 'react',
    }, EMPTY_PROJECT, 'demo-app')).toEqual([]);
  });

  // Chrome rejects `browser_specific_settings` and AMO requires it, so a project shipping to both stores gets two.
  it('writes a second manifest, named for its browser, for a project packaged for two stores', () => {
    const manifests = manifestsFor({ browsers: ['chrome', 'firefox'] });

    expect(Object.keys(manifests)).toEqual(['manifest.json', 'manifest.firefox.json']);
    expect(manifests['manifest.json']?.browser_specific_settings).toBeUndefined();
    expect(manifests['manifest.firefox.json']?.browser_specific_settings).toBeDefined();
    expect(manifests['manifest.json']?.background).toHaveProperty('service_worker');
    expect(manifests['manifest.firefox.json']?.background).toHaveProperty('scripts');
  });

  // A manifest naming a background entry nothing wrote will not load, and the entry registers the handler beside it.
  it.each<Browser>(['chrome', 'firefox'])('names a %s background entry the starter source writes', (browser) => {
    const answers = answersFor({
      browser,
      surfaces: ['background'],
    });
    const background = manifestsFor({
      browser,
      surfaces: ['background'],
    })['manifest.json']?.background ?? { scripts: [] };
    const entry = 'service_worker' in background ? background.service_worker : background.scripts[0];

    expect(starterSourceEmitter(answers).map(({ target }) => {
      return target;
    })).toEqual(expect.arrayContaining([entry, 'src/background/onInstalled.ts']));
  });
});
