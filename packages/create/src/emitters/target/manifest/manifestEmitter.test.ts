import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { isJsonObject } from '@utils/objectUtils';

import { DEFAULT_ANSWERS } from '@answers';

import { starterSourceEmitter } from '../starter-source/starterSourceEmitter';

import {
  emitManifest,
  type Manifest,
  manifestEmitter,
} from './manifestEmitter';

import type {
  Answers,
  Browser,
  Data,
  Styling,
  Surface,
} from '@config/types';

interface AnswerOverrides {
  browser?: Answers['browser'];
  browsers?: Browser[];
  surfaces?: Surface[];
  target?: Answers['target'];
  styling?: Styling;
  data?: Data;
}

const isManifest = (value: unknown): value is Manifest => {
  return isJsonObject(value) && 'manifest_version' in value;
};

const parseManifest = (text: string): Manifest => {
  const parsed: unknown = JSON.parse(text);

  if (!isManifest(parsed)) {
    throw new Error('manifest.json does not contain a JSON object');
  }

  return parsed;
};

const answersFor = (overrides: AnswerOverrides = {}): Answers => {
  const answers: Answers = {
    ...DEFAULT_ANSWERS,
    target: 'webextension',
    ...overrides,
  };

  return answers;
};

const manifestFor = (overrides: AnswerOverrides = {}): Manifest => {
  const emitted = emitManifest(answersFor(overrides), 'demo-app');

  if (emitted === null) {
    throw new Error('expected a manifest');
  }

  return parseManifest(emitted);
};

describe('emitManifest', () => {
  it('writes nothing for a target that is not an extension', () => {
    const reactManifest = emitManifest(answersFor({ target: 'react' }), 'demo-app');
    expect(reactManifest).toBeNull();
    const astroManifest = emitManifest(answersFor({ target: 'astro' }), 'demo-app');
    expect(astroManifest).toBeNull();
  });

  it('names the project and ships an empty permission surface', () => {
    const manifest = manifestFor();
    const expected = {
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
    };
    expect(manifest).toStrictEqual(expected);
  });

  it('defaults to a popup and a background entry', () => {
    const manifest = manifestFor();

    const popup = { default_popup: 'index.html' };
    expect(manifest.action).toEqual(popup);

    const serviceWorker = {
      service_worker: 'src/background/index.ts',
      type: 'module',
    };
    expect(manifest.background).toEqual(serviceWorker);

    expect(manifest.devtools_page).toBeUndefined();
  });

  it('spells the background entry the way the browser expects', () => {
    const serviceWorker = {
      service_worker: 'src/background/index.ts',
      type: 'module',
    };

    expect(manifestFor({ browser: 'chrome' }).background)
      .toEqual(serviceWorker);

    const eventPage = { scripts: ['src/background/index.ts'] };

    expect(manifestFor({ browser: 'firefox' }).background)
      .toEqual(eventPage);
  });

  it('carries gecko settings on firefox and not on chrome', () => {
    const expected = {
      gecko: {
        id: 'demo-app@example.com',
        strict_min_version: '140.0',
      },
    };
    expect(manifestFor({ browser: 'firefox' }).browser_specific_settings).toEqual(expected);

    expect(manifestFor({ browser: 'chrome' }).browser_specific_settings).toBeUndefined();
  });

  it('names only the surfaces that were answered', () => {
    const manifest = manifestFor({ surfaces: ['devtools-panel'] });

    expect(manifest.devtools_page).toBe('devtools.html');
    expect(manifest.action).toBeUndefined();
    expect(manifest.background).toBeUndefined();
  });

  it('names all three where all three were answered', () => {
    const manifest = manifestFor({ surfaces: [
      'popup',
      'background',
      'devtools-panel',
    ] });

    expect(manifest.action).toBeDefined();
    expect(manifest.background).toBeDefined();
    expect(manifest.devtools_page).toBe('devtools.html');
  });

  it('emits formatted json ending in a newline', () => {
    const emitted = emitManifest(answersFor(), 'demo-app');

    const actual = emitted?.endsWith('}\n');
    expect(actual).toBe(true);
    expect(emitted).toContain('\n  "manifest_version": 3,');
  });
});

describe('manifestEmitter', () => {
  const manifestsFor = (overrides: AnswerOverrides): Record<string, Manifest> => {
    const artifacts = manifestEmitter(answersFor(overrides), EMPTY_PROJECT, 'demo-app');
    const entries = artifacts
      .map((artifact) => {
        const text = 'text' in artifact.content ? artifact.content.text : '';
        const entry: [string, Manifest] = [artifact.target, parseManifest(text)];

        return entry;
      });

    return Object.fromEntries(entries);
  };

  it('plants one manifest, named for the project, on a project being born', () => {
    const artifacts = manifestEmitter(answersFor(), EMPTY_PROJECT, 'demo-app');

    const shapes = artifacts
      .map(({
        stage,
        target,
        seed,
      }) => {
        const shape = [
          stage,
          target,
          seed,
        ];

        return shape;
      });

    const expected = [[
      'standard',
      'manifest.json',
      true,
    ]];
    expect(shapes).toEqual(expected);

    expect(manifestsFor({})['manifest.json']?.name).toBe('demo-app');
  });

  it('writes none for a target that hosts no browser', () => {
    const artifacts = manifestEmitter({
      ...DEFAULT_ANSWERS,
      target: 'react',
    }, EMPTY_PROJECT, 'demo-app');

    expect(artifacts).toEqual([]);
  });

  it('writes a second manifest, named for its browser, for a project packaged for two stores', () => {
    const manifests = manifestsFor({ browsers: ['chrome', 'firefox'] });

    const actual = Object.keys(manifests);
    const expected = ['manifest.json', 'manifest.firefox.json'];
    expect(actual).toEqual(expected);
    expect(manifests['manifest.json']?.browser_specific_settings).toBeUndefined();
    expect(manifests['manifest.firefox.json']?.browser_specific_settings).toBeDefined();
    expect(manifests['manifest.json']?.background).toHaveProperty('service_worker');
    expect(manifests['manifest.firefox.json']?.background).toHaveProperty('scripts');
  });

  it.each<Browser>(['chrome', 'firefox'])('names a %s background entry the starter source writes', (browser) => {
    const answers = answersFor({
      browser,
      surfaces: ['background'],
    });
    const none: NonNullable<Manifest['background']> = { scripts: [] };
    const background = manifestsFor({
      browser,
      surfaces: ['background'],
    })['manifest.json']?.background ?? none;
    const entry = 'service_worker' in background ? background.service_worker : background.scripts[0];

    const targets = starterSourceEmitter(answers)
      .map(({ target }) => {
        return target;
      });

    expect(targets).toEqual(expect.arrayContaining([entry, 'src/background/onInstalled.ts']));
  });
});
