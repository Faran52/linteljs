import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  ANSWERS,
  type Answers,
  type Data,
  DEFAULT_ANSWERS,
  type PackageManager,
  type Styling,
  type TargetId,
  type Testing,
} from '#answers';
import { valuesOf } from '#utils/objectUtils';

import { buildScripts } from './scriptUtils';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
  packageManager?: PackageManager;
  styling?: Styling;
  data?: Data;
}

const TARGET_IDS = valuesOf(ANSWERS.target.values);

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

describe('buildScripts', () => {
  it('emits the target typecheck variant', () => {
    expect(buildScripts(answersFor({ target: 'vue' }))['typecheck']).toBe('vue-tsc --noEmit');
    // `--fail-on-warnings` is load-bearing, not decoration: Svelte reports accessibility as a compiler warning, and
    // without the flag `svelte-check` prints it and exits 0.
    expect(buildScripts(answersFor({ target: 'svelte' }))['typecheck']).toBe(
      'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings',
    );
    expect(buildScripts(answersFor({ target: 'react' }))['typecheck']).toBe('tsc --noEmit');
  });

  it('chains check through every gate the answers enable', () => {
    expect(buildScripts(answersFor({})).check).toBe(
      'pnpm lint && pnpm lint:types && pnpm lint:css && pnpm typecheck'
      + ' && pnpm test:coverage && pnpm build',
    );
    expect(buildScripts(answersFor({ testing: 'none' })).check).toBe(
      'pnpm lint && pnpm lint:types && pnpm lint:css && pnpm typecheck && pnpm build',
    );
    expect(buildScripts(answersFor({ packageManager: 'npm' })).check).toBe(
      'npm run lint && npm run lint:types && npm run lint:css && npm run typecheck'
      + ' && npm run test:coverage && npm run build',
    );
  });

  // The type floor as a gate of its own, since lint-staged scans staged files only. The checker picks the extensions.
  it.each<TargetId>(['react', 'astro', 'vue', 'svelte'])('runs the banned patterns over src for %s', (target) => {
    expect(buildScripts(answersFor({ target }))['lint:types']).toBe('node scripts/checkBannedPatterns.ts src');
  });

  // The fixing counterpart to `lint:fix`, over the same glob the gate reads; stylelint exits 2 on an empty match.
  it('gives css a fix script beside its gate', () => {
    expect(buildScripts(answersFor({}))['lint:css:fix'])
      .toBe('stylelint "src/**/*.css" --fix --allow-empty-input');
    expect(buildScripts(answersFor({ target: 'vue' }))['lint:css:fix'])
      .toBe('stylelint "src/**/*.{css,vue}" --fix --allow-empty-input');
  });

  /*
   * Every target declares its own now that no generator writes one, so there is no case where `build` is absent
   * and `check` chains a script that does not exist. React Native's is the one with a reason of its own: its `eas
   * build` needs an account, so `expo export` is the local Metro bundle instead (measurements in DESIGN.md).
   */
  it('writes the build script every record carries', () => {
    for (const target of TARGET_IDS) {
      expect([target, buildScripts(answersFor({ target }))['build']]).not.toEqual([target, undefined]);
    }

    expect(buildScripts(answersFor({ target: 'react-native' }))['build'])
      .toBe('expo export');
    expect(buildScripts(answersFor({ target: 'react' }))['build']).toBe('vite build');
    expect(buildScripts(answersFor({ target: 'svelte' }))['dev']).toBe('vite dev');
    expect(buildScripts(answersFor({ target: 'next' }))['build']).toBe('next build');
    expect(buildScripts(answersFor({ target: 'angular' }))['build']).toBe('ng build');
  });

  // Naming vitest in a project with no suite is a `check` that fails on command-not-found.
  it('names vitest for every target that has a suite', () => {
    const {
      test,
      'test:coverage': coverage,
      check,
    } = buildScripts(answersFor({ target: 'react-native' }));

    expect(test).toBe('vitest run --passWithNoTests');
    expect(coverage).toBe('vitest run --coverage');
    expect(check).toContain('test:coverage');
  });

  it('always wires husky through prepare', () => {
    expect(buildScripts(answersFor({}))['prepare']).toBe('husky');
  });

  // Replacing SvelteKit's own prepare breaks typecheck, and yarn 2+ runs no prepare at all.
  it('wires husky and the target step through postinstall on yarn, which runs no prepare', () => {
    const scripts = buildScripts(answersFor({
      target: 'svelte',
      packageManager: 'yarn',
    }));

    expect(scripts['postinstall']).toBe('svelte-kit sync && husky');
    expect(scripts).not.toHaveProperty('prepare');
  });
});
