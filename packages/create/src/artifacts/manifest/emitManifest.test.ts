import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type Surface,
} from '../../model/answers/answers';

import {
  emitManifest,
  type Manifest,
  parseManifest,
} from './emitManifest';

interface AnswerOverrides {
  browser?: Answers['browser'];
  surfaces?: Surface[];
  target?: Answers['target'];
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

  it('names the project and ships an empty permission surface', () => {
    const manifest = manifestFor();

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('demo-app');
    // The project's own security surface. A template guessing at it is how an extension over-asks.
    expect(manifest.permissions).toEqual([]);
    expect(manifest.host_permissions).toEqual([]);
  });

  /**
   * The default is the popup and background pair, which is what this target wrote before surfaces existed, so an older
   * `lintel.config.json` still describes the extension it generated.
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
  it('refuses text that is not a manifest object', () => {
    expect(() => {
      return parseManifest('[]');
    }).toThrow('manifest.json does not contain a JSON object');
  });

  // Read by a person and committed to a repository, so it is indented and ends in a newline like every other artifact.
  it('emits formatted json ending in a newline', () => {
    const emitted = emitManifest(answersFor(), 'demo-app');

    expect(emitted?.endsWith('}\n')).toBe(true);
    expect(emitted).toContain('\n  "manifest_version": 3,');
  });
});
