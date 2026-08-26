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

/**
 * Every reachable combination of those answers, labelled so a failure names the combination rather than only the
 * target. A record that hosts no axis contributes its single default case. Both tests below read this: an asset path
 * and a layer's plugin list are moved by the same answers.
 */
interface Axes {
  browsers: (Browser | undefined)[];
  hosted: (HostedFramework | undefined)[];
  surfaces: (Surface | undefined)[];
}

// Every record is built from answers now, so a test naming only an id still has to hand over a whole set.
const recordFor = (target: TargetId): TargetRecord => {
  return targetFor({
    ...DEFAULT_ANSWERS,
    target,
  });
};

// Every `assets/` path a record names; `pipeline.ts` reads each straight off the record with `readFile`, so a typo here
// becomes an ENOENT partway through a generate rather than a failing test.
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
    // Not on the record: `ruleArtifacts` derives both from the id, so a target added without them emits a path to a
    // file that isn't there.
    `claude-rules/repo-structure.${target.id}.md`,
    `claude-rules/testing.${target.id}.md`,
  ];
};

/**
 * One case per reachable combination of the answers that move a record, labelled so a failure names the combination
 * rather than only the target. A record that hosts neither axis contributes its single default case. Both tests below
 * read this: an asset path and a layer's plugin list are moved by the same two answers.
 */
/**
 * One case, from the answers that move a record. A surface arrives singly rather than as a set: each contributes
 * its own files and manifest entries independently, so a combination adds no path one of them does not.
 */
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

// `undefined` is a case of its own everywhere: not answering is what most projects do, and it is the answer an older
// config gives. A target with no slot for an axis contributes only that.
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

    // Plain loops rather than a triple `flatMap`, which nests four functions deep and reads as one expression.
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

  /**
   * Every answer set that can change an asset path, not just the defaults. Both axes reach into `assets/`: the browser
   * picks the background starter and the manifest, and a hosted framework adds its own state rule. Under the defaults
   * alone this test never opened a Firefox or an island file, and an end-to-end run is what caught the first path that
   * did not resolve.
   */
  it.each(axisCases())('names only shipped assets on %s', async (_label, answers) => {
    const paths = assetPathsOf(targetFor(answers));

    // Resolved together and asserted on the whole list, so a run names every missing file at once rather than only the
    // first.
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
 * A layer only works if the project installed what it imports. React Native listed its own copy of the react set rather
 * than the shared one, and adding `jsx-a11y` to the shared list therefore missed it: the generated project died on
 * `ERR_MODULE_NOT_FOUND` at the first `eslint .`, which only the end-to-end suite saw. This asserts the composition
 * instead of trusting each record to remember.
 *
 * One entry per framework layer, holding exactly what that layer's source imports, so the table is checkable by reading
 * the top of the layer file. It is read over every axis combination rather than the defaults, because a hosted
 * framework composes the same layer and owes it the same installs.
 */
const REACT_PLUGINS = ['@eslint-react/eslint-plugin', 'eslint-plugin-react-hooks', 'eslint-plugin-jsx-a11y'];

const LAYER_PLUGINS: Record<Framework, string[]> = {
  react: REACT_PLUGINS,
  // `defineConfig` composes `react()` ahead of `next()`, so a Next project owes both sets.
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
