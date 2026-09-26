import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Data,
  DEFAULT_ANSWERS,
  type PackageManager,
  type Styling,
  type TargetId,
  type Testing,
} from '@answers';

import { buildScripts } from './scriptUtils';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
  packageManager?: PackageManager;
  styling?: Styling;
  data?: Data;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

describe('buildScripts', () => {
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

  // `lint:fix` is the step every next-step message names, so it has to be the fixing run and not the gate.
  it('gives the linter a fix script beside its gate', () => {
    expect(buildScripts(answersFor({}))).toMatchObject({
      'lint': 'eslint .',
      'lint:fix': 'eslint . --fix',
    });
  });

  // The fixing counterpart to `lint:fix`, over the same glob the gate reads; stylelint exits 2 on an empty match.
  it('gives css a fix script beside its gate', () => {
    expect(buildScripts(answersFor({}))).toMatchObject({
      'lint:css': 'stylelint "src/**/*.css" --allow-empty-input',
      'lint:css:fix': 'stylelint "src/**/*.css" --fix --allow-empty-input',
    });
    expect(buildScripts(answersFor({ target: 'vue' }))).toMatchObject({
      'lint:css': 'stylelint "src/**/*.{css,vue}" --allow-empty-input',
      'lint:css:fix': 'stylelint "src/**/*.{css,vue}" --fix --allow-empty-input',
    });
  });

  /*
   * Every target declares its own `build`, so `check` never chains a script that does not exist. React Native's is
   * the one with a reason of its own: its `eas build` needs an account, so `expo export` is the local Metro bundle
   * instead (measurements in docs/DESIGN.md). The rest are each toolchain's own commands, which only a real project
   * can run.
   */
  it.each<[TargetId, Record<string, string>]>([
    ['react', {
      typecheck: 'tsc --noEmit',
      build: 'vite build',
      dev: 'vite',
      preview: 'vite preview',
      prepare: 'husky',
    }],
    ['next', {
      typecheck: 'next typegen && tsc --noEmit',
      build: 'next build',
      dev: 'next dev',
      start: 'next start',
      prepare: 'husky',
    }],
    ['vue', {
      typecheck: 'vue-tsc --noEmit',
      build: 'vite build',
      dev: 'vite',
      preview: 'vite preview',
      prepare: 'husky',
    }],
    ['nuxt', {
      typecheck: 'nuxt typecheck',
      build: 'nuxt build',
      dev: 'nuxt dev',
      preview: 'nuxt preview',
      generate: 'nuxt generate',
      prepare: 'nuxt prepare && husky',
    }],
    ['svelte', {
      // `--fail-on-warnings` is load-bearing: Svelte reports accessibility as a compiler warning, and without the
      // flag `svelte-check` prints it and exits 0.
      typecheck: 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings',
      build: 'vite build',
      dev: 'vite dev',
      preview: 'vite preview',
      prepare: 'svelte-kit sync && husky',
    }],
    ['solid', {
      typecheck: 'tsc --noEmit',
      build: 'vite build',
      dev: 'vite',
      preview: 'vite preview',
      prepare: 'husky',
    }],
    ['angular', {
      typecheck: 'tsc --noEmit',
      build: 'ng build',
      dev: 'ng serve',
      prepare: 'husky',
    }],
    ['astro', {
      typecheck: 'astro sync && astro check',
      build: 'astro build',
      prepare: 'astro sync && husky',
    }],
    ['webextension', {
      typecheck: 'tsc --noEmit',
      build: 'vite build',
      dev: 'vite',
      preview: 'vite preview',
      prepare: 'husky',
    }],
    ['react-native', {
      typecheck: 'tsc --noEmit',
      build: 'expo export',
      start: 'expo start',
      android: 'expo start --android',
      ios: 'expo start --ios',
      web: 'expo start --web',
      prepare: 'husky',
    }],
  ])('writes the scripts %s runs its own toolchain with', (target, own) => {
    expect(buildScripts(answersFor({ target }))).toMatchObject(own);
  });

  // Framework mode hands the build, the dev server and the type generation to React Router's own CLI.
  it('writes the scripts React Router runs in framework mode', () => {
    expect(buildScripts({
      ...answersFor({ target: 'react' }),
      router: 'react-router-framework',
    })).toMatchObject({
      typecheck: 'react-router typegen && tsc --noEmit',
      build: 'react-router build',
      dev: 'react-router dev',
      start: 'react-router-serve ./build/server/index.js',
      preview: 'react-router-serve ./build/server/index.js',
      prepare: 'react-router typegen && husky',
    });
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
