import {
  byKey,
  type GateRow,
  mswGates,
  TAILWIND,
  walkGates,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { webextensionTarget } from './webextensionTarget';

import type {
  Answers,
  Browser,
  HostedFramework,
} from '@config/types';

const extensionAnswers = (overrides: Partial<Answers> = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    target: 'webextension',
    ...overrides,
  };
};

const recordFor = (overrides: Partial<Answers> = {}) => {
  return webextensionTarget(extensionAnswers(overrides));
};

describe('the webextension record', () => {
  it('writes its own popup document', () => {
    expect(recordFor().htmlEntry).toBe('src/main.ts');
    expect(recordFor().build).toBe('vite build');
  });
});

describe('the browser axis', () => {
  it.each<[Browser, string]>([
    ['chrome', 'chrome'],
    ['firefox', 'firefox-webext-browser'],
  ])('gives %s its own ambient types', (browser, types) => {
    expect(recordFor({ browser }).tsconfig.types).toEqual([types]);
  });

  it('keeps crx as the bundler for both browsers', () => {
    expect(recordFor({ browser: 'chrome' }).vitePlugin?.calls).toContain('crx({ manifest })');
    expect(recordFor({ browser: 'firefox' }).vitePlugin?.calls).toContain('crx({ manifest })');
  });

  it('brings only the types each browser needs, and the same count for both', () => {
    const firefox = recordFor({ browser: 'firefox' }).devDependencies;
    const chrome = recordFor({ browser: 'chrome' }).devDependencies;

    expect(firefox).toContain('@types/firefox-webext-browser');
    expect(chrome).toContain('@types/chrome');
    expect(firefox).toHaveLength(chrome.length);
  });

  it.each<[Browser]>([
    ['chrome'],
    ['firefox'],
  ])('marks %s as the browser its background starter is written for', (browser) => {
    const record = recordFor({ browser });

    expect(record.starterFiles).toContainEqual({
      target: 'src/background/index.ts',
      variant: browser,
    });
    expect(record.starterFiles).toContainEqual({
      target: 'src/background/onInstalled.ts',
      variant: browser,
    });
    expect(record.starterTests).toContainEqual({
      target: 'src/background/onInstalled.test.ts',
      covers: 'src/background/onInstalled.ts',
      variant: browser,
    });
  });
});

describe('the surfaces axis', () => {
  it('defaults to a popup and a background', () => {
    const record = recordFor();
    const targets = record.starterFiles
      .map((file) => {
        return file.target;
      });

    expect(targets).toContain('src/popup/renderPopup.ts');
    expect(targets).toContain('src/background/onInstalled.ts');
    expect(record.coverageExclude).toEqual(['src/background/index.ts']);
    expect(record.viteInputs).toBeUndefined();
  });

  it('ships both devtools pages and gives the panel a build input', () => {
    const record = recordFor({ surfaces: ['devtools-panel'] });
    const targets = record.starterFiles
      .map((file) => {
        return file.target;
      });

    for (const page of [
      'devtools.html',
      'src/devtools/index.ts',
      'panel.html',
      'src/panel/index.ts',
      'src/panel/renderPanel.ts',
    ]) {
      expect(targets).toContain(page);
    }

    expect(record.viteInputs).toEqual({ panel: 'panel.html' });
  });

  it('excludes both entry shells and covers the panel body', () => {
    const record = recordFor({ surfaces: ['devtools-panel'] });

    expect(record.coverageExclude).toEqual(['src/devtools/index.ts', 'src/panel/index.ts']);
    expect(record.starterTests).toContainEqual({
      target: 'src/panel/renderPanel.test.ts',
      covers: 'src/panel/renderPanel.ts',
    });
  });

  it.each<[Browser]>([
    ['chrome'],
    ['firefox'],
  ])('marks %s as the browser its devtools registration is written for', (browser) => {
    const starterFiles = recordFor({
      browser,
      surfaces: ['devtools-panel'],
    }).starterFiles;

    expect(starterFiles).toContainEqual({
      target: 'src/devtools/index.ts',
      variant: browser,
    });
  });

  it('adds no surface file for a popup, which every project already is', () => {
    const popupOnly = recordFor({ surfaces: ['popup'] }).starterFiles
      .map((file) => {
        return file.target;
      });

    expect(popupOnly).toContain('src/popup/renderPopup.ts');
    expect(popupOnly).not.toContain('src/background/onInstalled.ts');
    expect(popupOnly).not.toContain('panel.html');
  });
});

describe('the hosted framework axis', () => {
  it('composes no framework by default', () => {
    const record = recordFor();

    expect(record.framework).toBeUndefined();
    expect(record.stateRules).toEqual([]);
    expect(record.naming['src/components/**/!(*.d|*.test|*.spec).ts']).toBe('PASCAL_CASE');
  });

  it.each<[HostedFramework, string]>([
    ['react', 'src/**/*.tsx'],
    ['vue', 'src/**/*.vue'],
    ['svelte', 'src/**/*.svelte'],
    ['solid', 'src/**/*.tsx'],
  ])('marks the component by extension once %s is hosted', (hostedFramework, componentGlob) => {
    const record = recordFor({ hostedFramework });

    expect(record.framework).toBe(hostedFramework);
    expect(record.naming[componentGlob]).toBe('!([a-z]*[A-Z]*)');
    expect(record.naming['src/components/**/!(*.d|*.test|*.spec).ts']).toBeUndefined();
  });

  it('runs the framework plugin ahead of crx', () => {
    expect(recordFor({ hostedFramework: 'solid' }).vitePlugin?.calls)
      .toEqual(['solid({ hot: process.env.VITEST === undefined })', 'crx({ manifest })']);
  });

  it('brings the framework itself, its lint plugins and its testing library', () => {
    const record = recordFor({ hostedFramework: 'vue' });

    expect(record.dependencies).toEqual(['vue']);
    expect(record.devDependencies).toContain('eslint-plugin-vue');
    expect(record.devDependencies).toContain('@vitejs/plugin-vue');
    expect(record.testDevDependencies).toEqual(['@vue/test-utils']);
    expect(record.stateRules).toEqual(['vue-reactivity.md']);
  });

  it('carries the single-file-component extension where the framework has one', () => {
    expect(recordFor({ hostedFramework: 'svelte' }).sfcExtension).toBe('svelte');
    expect(recordFor({ hostedFramework: 'react' }).sfcExtension).toBeUndefined();
  });

  it('carries the resolve conditions the framework needs under test', () => {
    expect(recordFor({ hostedFramework: 'svelte' }).testConditions).toEqual(['browser']);
    expect(recordFor({ hostedFramework: 'react' }).testConditions).toBeUndefined();
  });
});

describe('the host slots', () => {
  it('declares both, so the questionnaire asks them', () => {
    expect(recordFor().hostsBrowser).toBe(true);
    expect(recordFor().hostsFramework).toBe(true);
  });
});

const GATES: GateRow[] = [
  ...mswGates(false),
  ['src/styles/theme.css@tailwind', TAILWIND],
];

describe('the starter gates', () => {
  const walk = walkGates(webextensionTarget, 'webextension');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    expect(byKey(GATES)).toEqual(walk.gated);
  });

  it.each(GATES)('%s', (key, conditions) => {
    expect(walk.mismatchOf(key, conditions)).toBeUndefined();
  });
});
