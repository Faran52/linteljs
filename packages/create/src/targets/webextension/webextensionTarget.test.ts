import {
  ANSWERED,
  byKey,
  type Condition,
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

import { LANGUAGES } from '@config/constants';

import { DEFAULT_ANSWERS } from '@answers';

import { webextensionTarget } from './webextensionTarget';

import type {
  Answers,
  Browser,
  HostedFramework,
  Surface,
} from '@config/types';

const extensionAnswers = (overrides: Partial<Answers> = {}): Answers => {
  const answers: Answers = {
    ...DEFAULT_ANSWERS,
    target: 'webextension',
    ...overrides,
  };

  return answers;
};

const recordFor = (overrides: Partial<Answers> = {}) => {
  const answers = extensionAnswers(overrides);

  return webextensionTarget(answers);
};

describe('the webextension record', () => {
  it('writes its own popup document', () => {
    expect(recordFor().htmlEntry).toBe('src/main.ts');
    expect(recordFor().build).toBe('vite build');
  });

  it('imports the mark stylesheet only where the popup draws the mark', () => {
    const expected = [
      './styles/tokens.css',
      './styles/base.css',
      './lib/mark/mark.css',
    ];

    expect(recordFor({ surfaces: ['popup'] }).starterStyles)
      .toEqual(expected);

    const backgroundStyles = ['./styles/tokens.css', './styles/base.css'];
    expect(recordFor({ surfaces: ['background'] }).starterStyles).toEqual(backgroundStyles);
  });
});

describe('the browser axis', () => {
  it.each<[Browser, string]>([
    ['chrome', 'chrome'],
    ['firefox', 'firefox-webext-browser'],
  ])('gives %s its own ambient types', (browser, types) => {
    const expected = [types];
    expect(recordFor({ browser }).tsconfig.types).toEqual(expected);
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

    const expected = {
      target: 'src/background/index.ts',
      variant: browser,
    };
    expect(record.starterFiles).toContainEqual(expected);

    const onInstalled = {
      target: 'src/background/onInstalled.ts',
      variant: browser,
    };
    expect(record.starterFiles).toContainEqual(onInstalled);

    const onInstalledSuite = {
      target: 'src/background/onInstalled.test.ts',
      covers: 'src/background/onInstalled.ts',
      variant: browser,
    };
    expect(record.starterTests).toContainEqual(onInstalledSuite);
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
    const expected = ['src/background/index.ts'];
    expect(record.coverageExclude).toEqual(expected);
    expect(record.viteInputs).toBeUndefined();
  });

  it('ships both devtools pages and gives the panel a build input', () => {
    const record = recordFor({ surfaces: ['devtools-panel'] });
    const targets = record.starterFiles
      .map((file) => {
        return file.target;
      });

    const devtoolsPages = [
      'devtools.html',
      'src/devtools/index.ts',
      'panel.html',
      'src/panel/index.ts',
      'src/panel/renderPanel.ts',
    ];

    for (const page of devtoolsPages) {
      expect(targets).toContain(page);
    }

    const expected = { panel: 'panel.html' };
    expect(record.viteInputs).toEqual(expected);
  });

  it('excludes both entry shells and the record no page reads, and covers the panel body', () => {
    const record = recordFor({ surfaces: ['devtools-panel'] });

    const expected = [
      'src/config/linteljs.ts',
      'src/devtools/index.ts',
      'src/panel/index.ts',
    ];
    expect(record.coverageExclude).toEqual(expected);

    const panelSuite = {
      target: 'src/panel/renderPanel.test.ts',
      covers: 'src/panel/renderPanel.ts',
    };
    expect(record.starterTests).toContainEqual(panelSuite);
  });

  it.each<[Browser]>([
    ['chrome'],
    ['firefox'],
  ])('marks %s as the browser its devtools registration is written for', (browser) => {
    const { starterFiles } = recordFor({
      browser,
      surfaces: ['devtools-panel'],
    });

    const expected = {
      target: 'src/devtools/index.ts',
      variant: browser,
    };
    expect(starterFiles).toContainEqual(expected);
  });

  it('writes the popup and nothing else for a popup alone', () => {
    const popupOnly = recordFor({ surfaces: ['popup'] }).starterFiles
      .map((file) => {
        return file.target;
      });

    expect(popupOnly).toContain('src/popup/renderPopup.ts');
    expect(popupOnly).not.toContain('src/background/onInstalled.ts');
    expect(popupOnly).not.toContain('panel.html');
  });

  it.each<[string, Surface[], boolean]>([
    [
      'a devtools panel',
      ['devtools-panel'],
      true,
    ],
    [
      'a background alone',
      ['background'],
      false,
    ],
  ])('writes no popup, mark or popup page for %s', (_label, surfaces, html) => {
    const record = recordFor({ surfaces });
    const starters = [...record.starterFiles, ...record.starterTests];
    const written = starters
      .map((file) => {
        return file.target;
      })
      .filter((target) => {
        return target === 'src/main.ts' || target.startsWith('src/popup/') || target.startsWith('src/lib/mark/');
      });

    expect(written).toEqual([]);
    expect(record.htmlEntry).toBeUndefined();
    expect(record.starterStyles).not.toContain('./lib/mark/mark.css');
    expect(record.html).toBe(html);
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
    const expected = ['solid({ hot: process.env.VITEST === undefined })', 'crx({ manifest })'];

    expect(recordFor({ hostedFramework: 'solid' }).vitePlugin?.calls)
      .toEqual(expected);
  });

  it('brings the framework itself, its lint plugins and its testing library', () => {
    const record = recordFor({ hostedFramework: 'vue' });

    const expected = ['vue'];
    expect(record.dependencies).toEqual(expected);
    expect(record.devDependencies).toContain('eslint-plugin-vue');
    expect(record.devDependencies).toContain('@vitejs/plugin-vue');
    const testingLibrary = ['@vue/test-utils'];
    expect(record.testDevDependencies).toEqual(testingLibrary);
    const vueRules = ['vue-reactivity.md'];
    expect(record.stateRules).toEqual(vueRules);
  });

  it('carries the single-file-component extension where the framework has one', () => {
    expect(recordFor({ hostedFramework: 'svelte' }).sfcExtension).toBe('svelte');
    expect(recordFor({ hostedFramework: 'react' }).sfcExtension).toBeUndefined();
  });

  it('carries the resolve conditions the framework needs under test', () => {
    const expected = ['browser'];
    expect(recordFor({ hostedFramework: 'svelte' }).testConditions).toEqual(expected);
    expect(recordFor({ hostedFramework: 'react' }).testConditions).toBeUndefined();
  });
});

describe('the languages', () => {
  it('are offered with a popup, installing nothing, and not without one', () => {
    const popup = recordFor({ surfaces: ['popup'] }).i18n;
    const background = recordFor({ surfaces: ['background'] }).i18n;

    const expected = { dependencies: [] };
    expect(popup).toEqual(expected);
    expect(background).toBeUndefined();
  });
});

describe('the host slots', () => {
  it('declares both, so the questionnaire asks them', () => {
    expect(recordFor().hostsBrowser).toBe(true);
    expect(recordFor().hostsFramework).toBe(true);
  });
});

// Only a popup has text to translate, so only a popup takes languages.
const POPUP_SURFACES: (Surface[] | undefined)[] = [undefined, ['popup']];
const ENGLISH_POPUP: readonly Condition[] = [{
  surfaces: POPUP_SURFACES,
  languages: [undefined],
}];
const TRANSLATED_POPUP: readonly Condition[] = [{
  surfaces: POPUP_SURFACES,
  languages: ANSWERED,
}];

const I18N_ONLY_PATHS = [
  'src/i18n/index.ts',
  'src/i18n/index.test.ts',
  'src/i18n/locales.test.ts',
  ...LANGUAGES
    .map((language) => {
      return `src/i18n/locales/${language}/common.json`;
    }),
];

const POPUP_PATHS = ['src/popup/renderPopup.ts', 'src/popup/renderPopup.test.ts'];

const GATES: GateRow[] = [
  ...mswGates(false),
  ['src/styles/theme.css@tailwind', TAILWIND],
  ...POPUP_PATHS
    .flatMap((key): GateRow[] => {
      const rows: GateRow[] = [[key, ENGLISH_POPUP], [`${key}@i18n`, TRANSLATED_POPUP]];

      return rows;
    }),
  ...I18N_ONLY_PATHS
    .map((key): GateRow => {
      const row: GateRow = [`${key}@i18n`, TRANSLATED_POPUP];

      return row;
    }),
];

describe('the starter gates', () => {
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(webextensionTarget, 'webextension');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(webextensionTarget, 'webextension');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(webextensionTarget, 'webextension');
    const mismatches = walk.mismatchesOf(GATES);
    expect(mismatches).toEqual([]);
  });
});
