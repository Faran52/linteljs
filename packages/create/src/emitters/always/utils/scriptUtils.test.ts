import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { buildScripts, gateScripts } from './scriptUtils';

import type { TargetId } from '@config/types';

describe('gateScripts', () => {
  it('lists the legs of check in order, the coverage leg only with tests', () => {
    expect(gateScripts(answersFor({}))).toEqual([
      'lint',
      'lint:types',
      'lint:css',
      'typecheck',
      'test:coverage',
      'build',
    ]);
    expect(gateScripts(answersFor({ testing: 'none' }))).not.toContain('test:coverage');
  });
});

describe('buildScripts', () => {
  it('writes no test scripts when testing is declined', () => {
    const scripts = buildScripts(answersFor({ testing: 'none' }));

    expect(scripts).not.toHaveProperty('test');
    expect(scripts).not.toHaveProperty('test:coverage');
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

  it.each<TargetId>(['react', 'astro', 'vue', 'svelte'])('runs the banned patterns over src for %s', (target) => {
    expect(buildScripts(answersFor({ target }))['lint:types']).toBe('node scripts/checkBannedPatterns.ts src');
  });

  it('gives the linter a fix script beside its gate', () => {
    expect(buildScripts(answersFor({}))).toMatchObject({
      'lint': 'eslint .',
      'lint:fix': 'eslint . --fix',
    });
  });

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

  it('writes the scripts React Router runs in framework mode', () => {
    const scripts = buildScripts({
      ...answersFor({ target: 'react' }),
      router: 'react-router-framework',
    });

    expect(scripts).toMatchObject({
      typecheck: 'react-router typegen && tsc --noEmit',
      build: 'react-router build',
      dev: 'react-router dev',
      start: 'react-router-serve ./build/server/index.js',
      preview: 'react-router-serve ./build/server/index.js',
      prepare: 'react-router typegen && husky',
    });
  });

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

  it('wires husky and the target step through postinstall on yarn, which runs no prepare', () => {
    const scripts = buildScripts(answersFor({
      target: 'svelte',
      packageManager: 'yarn',
    }));

    expect(scripts['postinstall']).toBe('svelte-kit sync && husky');
    expect(scripts).not.toHaveProperty('prepare');
  });
});
