import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '../answers/answers';

import { webextension } from './webextension';

import type {
  Answers,
  Browser,
  HostedFramework,
} from '../answers/answers';

const extensionAnswers = (overrides: Partial<Answers> = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    target: 'webextension',
    ...overrides,
  };
};

const recordFor = (overrides: Partial<Answers> = {}) => {
  return webextension(extensionAnswers(overrides));
};

describe('scaffold', () => {
  it('writes the exact argv for the default answers', () => {
    expect(recordFor().scaffold('demo-app', DEFAULT_ANSWERS)).toEqual({
      kind: 'create',
      args: ['vite', 'demo-app', '--template', 'vanilla-ts', '--no-interactive', '--no-immediate'],
    });
  });
});

describe('the browser axis', () => {
  /**
   * `crx` builds for both, so what the browser decides is the manifest shape and the ambient types. Its own manifest
   * type carries the `service_worker` and the `scripts` background forms and `browser_specific_settings.gecko`.
   */
  it.each<[Browser, string]>([
    ['chrome', 'chrome'],
    ['firefox', 'firefox-webext-browser'],
  ])('gives %s its own ambient types', (browser, types) => {
    expect(recordFor({ browser }).tsconfig.types).toEqual([types]);
  });

  it('keeps crx as the bundler for both browsers', () => {
    expect(recordFor({ browser: 'chrome' }).vitePlugin.calls).toContain('crx({ manifest })');
    expect(recordFor({ browser: 'firefox' }).vitePlugin.calls).toContain('crx({ manifest })');
  });

  // `web-ext` runs, lints and packages a Firefox build; Chrome has no equivalent it needs.
  it('brings web-ext on firefox and not on chrome', () => {
    expect(recordFor({ browser: 'firefox' }).devDependencies).toContain('web-ext');
    expect(recordFor({ browser: 'chrome' }).devDependencies).not.toContain('web-ext');
  });

  /**
   * The starter is per browser, not shared. Found end to end: the Firefox project shipped Chrome's `chrome.runtime`
   * entry against types that declare `browser.*` alone, which lints as three findings on an unresolvable global. The
   * handler's test moves with it because Firefox's details type requires `temporary`.
   */
  it.each<[Browser, string]>([
    ['chrome', ''],
    ['firefox', '.firefox'],
  ])('gives %s the background starter written in its own namespace', (browser, infix) => {
    const record = recordFor({ browser });

    expect(record.starterFiles).toEqual([
      {
        source: `starter/webextension/background${infix}.ts`,
        target: 'src/background/index.ts',
      },
      {
        source: `starter/webextension/onInstalled${infix}.ts`,
        target: 'src/background/onInstalled.ts',
      },
    ]);
    expect(record.starterTests).toContainEqual({
      source: `starter/webextension/onInstalled${infix}.test.ts`,
      target: 'src/background/onInstalled.test.ts',
      covers: 'src/background/onInstalled.ts',
    });
  });
});

describe('the surfaces axis', () => {
  /**
   * The default is what this target wrote before the answer existed, so nothing changes for a project generated then.
   * Asserted as the exact list because the point is that it is a pair, not that it is non-empty.
   */
  it('defaults to a popup and a background', () => {
    const record = recordFor();

    expect(record.starterFiles?.map((file) => {
      return file.target;
    })).toEqual(['src/background/index.ts', 'src/background/onInstalled.ts']);
    expect(record.coverageExclude).toEqual(['src/background/index.ts']);
    expect(record.viteInputs).toBeUndefined();
  });

  /**
   * A devtools panel is two pages: the devtools page the browser opens invisibly, whose only job is to register the
   * panel, and the panel itself. crx builds the first because the manifest names it, and cannot know about the second,
   * so the panel needs a Rollup input of its own.
   */
  it('ships both devtools pages and gives the panel a build input', () => {
    const record = recordFor({ surfaces: ['devtools-panel'] });
    const targets = record.starterFiles?.map((file) => {
      return file.target;
    });

    expect(targets).toEqual([
      'devtools.html',
      'src/devtools/index.ts',
      'panel.html',
      'src/panel/index.ts',
      'src/panel/renderPanel.ts',
    ]);
    expect(record.viteInputs).toEqual({ panel: 'panel.html' });
  });

  // Same reason the background entry is excluded: a registration call has no branch of its own.
  it('excludes both entry shells and covers the panel body', () => {
    const record = recordFor({ surfaces: ['devtools-panel'] });

    expect(record.coverageExclude).toEqual(['src/devtools/index.ts', 'src/panel/index.ts']);
    expect(record.starterTests).toContainEqual({
      source: 'starter/webextension/renderPanel.test.ts',
      target: 'src/panel/renderPanel.test.ts',
      covers: 'src/panel/renderPanel.ts',
    });
  });

  // The devtools registration names a namespace, so it moves with the browser exactly as the background entry does.
  it.each<[Browser, string]>([
    ['chrome', 'starter/webextension/devtools.ts'],
    ['firefox', 'starter/webextension/devtools.firefox.ts'],
  ])('gives %s the devtools registration in its own namespace', (browser, source) => {
    expect(recordFor({
      browser,
      surfaces: ['devtools-panel'],
    }).starterFiles)
      .toContainEqual({
        source,
        target: 'src/devtools/index.ts',
      });
  });

  // A popup's page and entry come from the Vite scaffold, so the surface adds no starter of its own.
  it('adds no starter for a popup, whose page the scaffold already wrote', () => {
    expect(recordFor({ surfaces: ['popup'] }).starterFiles).toEqual([]);
  });
});

describe('the hosted framework axis', () => {
  it('composes no framework by default', () => {
    const record = recordFor();

    expect(record.framework).toBeUndefined();
    expect(record.stateRules).toEqual([]);
    // The directory-based component rule, which only a host with no framework uses.
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
    // Replaced, not added to: two disagreeing conventions on one file satisfy neither.
    expect(record.naming['src/components/**/!(*.d|*.test|*.spec).ts']).toBeUndefined();
  });

  // The framework plugin has to run before `crx`, which wraps whatever the plugins ahead of it produced.
  it('runs the framework plugin ahead of crx', () => {
    const { calls } = recordFor({ hostedFramework: 'solid' }).vitePlugin;

    expect(calls.indexOf('solid({ hot: process.env.VITEST === undefined })'))
      .toBeLessThan(calls.indexOf('crx({ manifest })'));
  });

  // A vanilla scaffold installs no framework, so the record has to bring it as a runtime dependency.
  it('brings the framework itself, its lint plugins and its testing library', () => {
    const record = recordFor({ hostedFramework: 'vue' });

    expect(record.dependencies).toEqual(['vue']);
    expect(record.devDependencies).toContain('eslint-plugin-vue');
    expect(record.devDependencies).toContain('@vitejs/plugin-vue');
    expect(record.testDevDependencies).toEqual(['@vue/test-utils']);
    expect(record.stateRules).toEqual(['vue-reactivity.md']);
  });

  // Drives the stylelint syntax and the `lint:css` glob, so a `<style>` block in an extension is linted too.
  it('carries the single-file-component extension where the framework has one', () => {
    expect(recordFor({ hostedFramework: 'svelte' }).sfcExtension).toBe('svelte');
    expect(recordFor({ hostedFramework: 'react' }).sfcExtension).toBeUndefined();
  });

  // Without `browser`, vitest resolves Svelte's and Solid's server build and the first render throws.
  it('carries the resolve conditions the framework needs under test', () => {
    expect(recordFor({ hostedFramework: 'svelte' }).testConditions).toEqual(['browser']);
    expect(recordFor({ hostedFramework: 'react' }).testConditions).toBeUndefined();
  });
});

// Both questions are asked only where they mean something, the way the store question already works.
describe('the host slots', () => {
  it('declares both, so the questionnaire asks them', () => {
    expect(recordFor().hostsBrowser).toBe(true);
    expect(recordFor().hostsFramework).toBe(true);
  });
});
