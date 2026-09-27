import { access, constants } from 'node:fs/promises';
import { join } from 'node:path';

import { byName } from '@mocks/byName';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Browser,
  type Framework,
  type HostedFramework,
  type Surface,
  type TargetId,
} from '@config/types';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';
import { TEMPLATES_ROOT } from '@disk';
import { buildDevDependencies } from '@emitters';

import { targetFor, TARGETS } from './registry';

import type { TargetRecord } from './types';

interface Axes {
  browsers: (Browser | undefined)[];
  hosted: (HostedFramework | undefined)[];
  surfaces: (Surface | undefined)[];
}

const BROWSERS = valuesOf(ANSWERS.browser.values);
const HOSTED_FRAMEWORKS = valuesOf(ANSWERS.hostedFramework.values);
const SURFACES = valuesOf(ANSWERS.surfaces.values);
const TARGET_IDS = valuesOf(ANSWERS.target.values);

const recordFor = (target: TargetId): TargetRecord => {
  return targetFor({
    ...DEFAULT_ANSWERS,
    target,
  });
};

const assetPathsOf = (target: TargetRecord): string[] => {
  return [
    ...(target.testSetup === undefined ? [] : [target.testSetup]),
    ...target.stateRules
      .map((rule) => {
        return `fragments/claude-rules/${rule}`;
      }),
    `fragments/claude-rules/repo-structure.${target.id}.md`,
    `fragments/claude-rules/testing.${target.id}.md`,
  ];
};

const caseFor = (
  base: Answers,
  browser: Browser | undefined,
  hostedFramework: HostedFramework | undefined,
  surface: Surface | undefined,
): [string, Answers] => {
  const answers: Answers = {
    ...base,
    ...(browser === undefined ? {} : { browser }),
    ...(hostedFramework === undefined ? {} : { hostedFramework }),
    ...(surface === undefined ? {} : { surfaces: [surface] }),
  };
  const label = [base.target, browser, hostedFramework, surface]
    .filter(Boolean)
    .join(' on ');

  return [label, answers];
};

const axesOf = (base: Answers): Axes => {
  const { hostsBrowser, hostsFramework } = targetFor(base);

  return {
    browsers: hostsBrowser === true ? [...BROWSERS] : [undefined],
    hosted: hostsFramework === true ? [undefined, ...HOSTED_FRAMEWORKS] : [undefined],
    surfaces: hostsBrowser === true ? [undefined, ...SURFACES] : [undefined],
  };
};

const axisCases = (): [string, Answers][] => {
  const cases: [string, Answers][] = [];

  for (const target of TARGET_IDS) {
    const base: Answers = {
      ...DEFAULT_ANSWERS,
      target,
    };
    const {
      browsers,
      hosted,
      surfaces,
    } = axesOf(base);

    for (const browser of browsers) {
      for (const hostedFramework of hosted) {
        for (const surface of surfaces) {
          cases.push(caseFor(base, browser, hostedFramework, surface));
        }
      }
    }
  }

  return cases;
};

describe('TARGETS', () => {
  it('holds one record per known target id, keyed by its own id', () => {
    for (const id of TARGET_IDS) {
      expect(recordFor(id).id).toBe(id);
    }
  });

  it('holds exactly the nine known targets, no more and no fewer', () => {
    const registered = Object.keys(TARGETS)
      .sort(byName);

    expect(registered).toEqual([...TARGET_IDS].sort(byName));
  });

  it.each(axisCases())('names only shipped assets on %s', async (_label, answers) => {
    const paths = assetPathsOf(targetFor(answers));

    const missingChecks = paths
      .map(async (path) => {
        try {
          await access(join(TEMPLATES_ROOT, path), constants.R_OK);

          return '';
        }
        catch {
          return path;
        }
      });

    const missing = await Promise.all(missingChecks);

    expect(missing.filter(Boolean)).toEqual([]);
  });

  it.each(axisCases())('has every suite on %s cover a file the target writes', (_label, answers) => {
    const { starterFiles, starterTests } = targetFor(answers);
    const starterTargets = starterFiles
      .map(({ target }) => {
        return target;
      });

    const written = new Set(starterTargets);

    const uncovering = starterTests
      .filter(({ covers }) => {
        return !written.has(covers);
      });

    expect(uncovering).toEqual([]);
  });
});

describe('what each target offers', () => {
  it.each<[TargetId, string[] | undefined, string[] | undefined]>([
    [
      'react',
      ['zustand', 'redux-toolkit', 'tanstack-store'],
      ['react-router', 'react-router-framework', 'tanstack-router'],
    ],
    ['next', ['zustand', 'redux-toolkit', 'tanstack-store'], undefined],
    ['vue', ['pinia', 'tanstack-store'], undefined],
    ['nuxt', ['pinia', 'tanstack-store'], undefined],
    ['svelte', ['tanstack-store'], undefined],
    ['solid', ['tanstack-store'], undefined],
    ['angular', ['ngrx-signals', 'ngrx-store'], undefined],
    ['astro', ['nanostores'], undefined],
    ['webextension', undefined, undefined],
    ['react-native', ['zustand', 'redux-toolkit', 'tanstack-store'], undefined],
  ])('offers %s its own stores and routers', (target, stores, routers) => {
    const record = recordFor(target);

    expect([record.stores, record.routers]).toEqual([stores, routers]);
  });

  it.each<[string, Answers, string[], string[] | undefined]>([
    ['react', {
      ...DEFAULT_ANSWERS,
      target: 'react',
    }, ['react-state.md', 'hooks-order.md'], undefined],
    ['next', {
      ...DEFAULT_ANSWERS,
      target: 'next',
    }, ['react-state.md', 'hooks-order.md'], undefined],
    ['vue', {
      ...DEFAULT_ANSWERS,
      target: 'vue',
    }, ['vue-reactivity.md'], undefined],
    ['nuxt', {
      ...DEFAULT_ANSWERS,
      target: 'nuxt',
    }, ['vue-reactivity.md'], undefined],
    ['svelte', {
      ...DEFAULT_ANSWERS,
      target: 'svelte',
    }, ['svelte-reactivity.md'], ['browser']],
    ['solid', {
      ...DEFAULT_ANSWERS,
      target: 'solid',
    }, ['solid-reactivity.md'], ['development', 'browser']],
    ['angular', {
      ...DEFAULT_ANSWERS,
      target: 'angular',
    }, [], undefined],
    ['astro', {
      ...DEFAULT_ANSWERS,
      target: 'astro',
    }, [], undefined],
    ['react-native', {
      ...DEFAULT_ANSWERS,
      target: 'react-native',
    }, ['react-state.md', 'hooks-order.md'], undefined],
    ...HOSTED_FRAMEWORKS
      .flatMap((hostedFramework): [string, Answers, string[], string[] | undefined][] => {
        const rules = {
          react: ['react-state.md', 'hooks-order.md'],
          vue: ['vue-reactivity.md'],
          svelte: ['svelte-reactivity.md'],
          solid: ['solid-reactivity.md'],
        }[hostedFramework];
        const conditions = {
          react: undefined,
          vue: undefined,
          svelte: ['browser'],
          solid: ['development', 'browser'],
        }[hostedFramework];

        return (['astro', 'webextension'] as const)
          .map((target): [string, Answers, string[], string[] | undefined] => {
            return [`${target} hosting ${hostedFramework}`, {
              ...DEFAULT_ANSWERS,
              target,
              hostedFramework,
            }, rules, conditions];
          });
      }),
  ])('holds %s to its own state rules and test conditions', (_label, answers, rules, conditions) => {
    const record = targetFor(answers);

    expect([record.stateRules, record.testConditions]).toEqual([rules, conditions]);
  });
});

describe('targetFor', () => {
  it('returns the record matching the id it is asked for', () => {
    expect(recordFor('svelte').id).toBe('svelte');
  });

  it('returns a different record for a different id', () => {
    expect(recordFor('react')).not.toBe(recordFor('vue'));
  });
});

const REACT_PLUGINS = ['@eslint-react/eslint-plugin', 'eslint-plugin-react-hooks', 'eslint-plugin-jsx-a11y-x'];

const LAYER_PLUGINS: Record<Framework, string[]> = {
  'react': REACT_PLUGINS,
  'next': [...REACT_PLUGINS, '@next/eslint-plugin-next'],
  'react-native': REACT_PLUGINS
    .filter((name) => {
      return name !== 'eslint-plugin-jsx-a11y-x';
    }),
  'solid': ['eslint-plugin-solid', 'eslint-plugin-jsx-a11y-x'],
  'vue': ['eslint-plugin-vue', 'eslint-plugin-vuejs-accessibility'],
  'nuxt': ['eslint-plugin-vue', 'eslint-plugin-vuejs-accessibility'],
  'svelte': ['eslint-plugin-svelte'],
  'angular': ['angular-eslint'],
};

describe('a framework layer and the plugins it loads', () => {
  it.each(axisCases())('installs what the layers for %s import', (label, answers) => {
    const { framework } = targetFor(answers);
    const installed = Object.keys(buildDevDependencies(answers));

    const missing = (framework === undefined ? [] : LAYER_PLUGINS[framework])
      .filter((name) => {
        return !installed.includes(name);
      });

    expect({
      label,
      missing,
    }).toEqual({
      label,
      missing: [],
    });
  });
});
