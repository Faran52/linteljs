import { access, constants } from 'node:fs/promises';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { buildDevDependencies } from '../../artifacts/package-json/emitPackageJson';
import { ASSETS_ROOT } from '../../run/shipped-assets/shippedAssets';
import {
  BROWSERS,
  DEFAULT_ANSWERS,
  HOSTED_FRAMEWORKS,
  SURFACES,
  TARGET_IDS,
} from '../answers/answers';

import { targetFor, TARGETS } from './registry';

import type {
  Answers,
  Browser,
  Framework,
  HostedFramework,
  Surface,
  TargetId,
} from '../answers/answers';
import type { TargetRecord } from './record';

// Every reachable combination, labelled so a failure names the combination rather than only the target.
interface Axes {
  browsers: (Browser | undefined)[];
  hosted: (HostedFramework | undefined)[];
  surfaces: (Surface | undefined)[];
}

const recordFor = (target: TargetId): TargetRecord => {
  return targetFor({
    ...DEFAULT_ANSWERS,
    target,
  });
};

// `pipeline.ts` reads each straight off the record with `readFile`, so a typo is an ENOENT mid-generate.
const assetPathsOf = (target: TargetRecord): string[] => {
  return [
    ...(target.starterFiles ?? []).map((file) => {
      return file.source;
    }),
    ...(target.starterTests ?? []).map((test) => {
      return test.source;
    }),
    ...(target.testSetup === undefined ? [] : [target.testSetup]),
    ...target.stateRules.map((rule) => {
      return `claude-rules/${rule}`;
    }),
    // `ruleArtifacts` derives both from the id, so a target added without them emits a path to nothing.
    `claude-rules/repo-structure.${target.id}.md`,
    `claude-rules/testing.${target.id}.md`,
  ];
};

// A surface arrives singly: each contributes its own files, so a combination adds no path one of them does not.
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
  const label = [base.target, browser, hostedFramework, surface].filter(Boolean).join(' on ');

  return [label, answers];
};

// `undefined` is a case of its own: not answering is what most projects do.
const axesOf = (base: Answers): Axes => {
  const { hostsBrowser, hostsFramework } = targetFor(base);

  return {
    browsers: hostsBrowser === true ? BROWSERS : [undefined],
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
    const byName = (left: string, right: string): number => {
      return left.localeCompare(right, 'en');
    };

    expect(Object.keys(TARGETS).sort(byName)).toEqual([...TARGET_IDS].sort(byName));
  });

  // Both axes reach into `assets/`; under the defaults alone this never opened a Firefox or an island file.
  it.each(axisCases())('names only shipped assets on %s', async (_label, answers) => {
    const paths = assetPathsOf(targetFor(answers));

    // The whole list, so a run names every missing file at once.
    const missing = await Promise.all(paths.map(async (path) => {
      try {
        await access(join(ASSETS_ROOT, path), constants.R_OK);

        return '';
      }
      catch {
        return path;
      }
    }));

    expect(missing.filter(Boolean)).toEqual([]);
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

/**
 * A layer only works if the project installed what it imports: React Native once listed its own copy of the react
 * set, and adding `jsx-a11y` to the shared list missed it (`ERR_MODULE_NOT_FOUND` at the first `eslint .`). One
 * entry per layer, holding what that layer's source imports.
 */
const REACT_PLUGINS = ['@eslint-react/eslint-plugin', 'eslint-plugin-react-hooks', 'eslint-plugin-jsx-a11y'];

const LAYER_PLUGINS: Record<Framework, string[]> = {
  react: REACT_PLUGINS,
  // `defineConfig` composes `react()` ahead of `next()`.
  next: [...REACT_PLUGINS, '@next/eslint-plugin-next'],
  solid: ['eslint-plugin-solid', 'eslint-plugin-jsx-a11y'],
  vue: ['eslint-plugin-vue', 'eslint-plugin-vuejs-accessibility'],
  svelte: ['eslint-plugin-svelte'],
  angular: ['angular-eslint'],
};

describe('a framework layer and the plugins it loads', () => {
  it.each(axisCases())('installs what the layers for %s import', (label, answers) => {
    const { framework } = targetFor(answers);
    const installed = Object.keys(buildDevDependencies(answers));

    const missing = (framework === undefined ? [] : LAYER_PLUGINS[framework]).filter((name) => {
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
