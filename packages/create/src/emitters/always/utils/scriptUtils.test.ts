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
    const actual = gateScripts(answersFor({}));
    const expected = [
      'lint',
      'lint:types',
      'lint:css',
      'typecheck',
      'test:coverage',
      'build',
    ];
    expect(actual).toEqual(expected);

    const withoutTesting = gateScripts(answersFor({ testing: 'none' }));
    expect(withoutTesting).not.toContain('test:coverage');
  });
});

describe('buildScripts', () => {
  it('writes no test scripts when testing is declined', () => {
    const scripts = buildScripts(answersFor({ testing: 'none' }));

    expect(scripts).not.toHaveProperty('test');
    expect(scripts).not.toHaveProperty('test:coverage');
  });

  it('chains check through every gate the answers enable', () => {
    const { check: fullCheck } = buildScripts(answersFor({}));
    const { check: untestedCheck } = buildScripts(answersFor({ testing: 'none' }));
    const { check: npmCheck } = buildScripts(answersFor({ packageManager: 'npm' }));

    expect(fullCheck).toBe(
      'pnpm lint && pnpm lint:types && pnpm lint:css && pnpm typecheck'
      + ' && pnpm test:coverage && pnpm build',
    );

    expect(untestedCheck).toBe(
      'pnpm lint && pnpm lint:types && pnpm lint:css && pnpm typecheck && pnpm build',
    );

    expect(npmCheck).toBe(
      'npm run lint && npm run lint:types && npm run lint:css && npm run typecheck'
      + ' && npm run test:coverage && npm run build',
    );
  });

  it.each<TargetId>([
    'react',
    'astro',
    'vue',
    'svelte',
  ])('runs the banned patterns over src for %s', (target) => {
    const { 'lint:types': lintTypes } = buildScripts(answersFor({ target }));
    expect(lintTypes).toBe('node scripts/checkBannedPatterns.ts src');
  });

  it('compiles the catalog before prepare and typecheck once a language is chosen', () => {
    const translated = buildScripts(answersFor({
      target: 'svelte',
      languages: ['ja'],
    }));
    const english = buildScripts(answersFor({ target: 'svelte' }));
    const compile = 'paraglide-js compile --project ./project.inlang --outdir ./.svelte-kit/paraglide'
      + ' --strategy baseLocale --emit-ts-declarations';

    expect(translated['prepare']).toBe(`${compile} && svelte-kit sync && husky`);
    expect(translated['typecheck']).toBe(`${compile} && ${english['typecheck'] ?? ''}`);
    expect(english['prepare']).toBe('svelte-kit sync && husky');
  });

  it('compiles nothing for a language on a target whose i18n has no compiler', () => {
    const translated = buildScripts(answersFor({
      target: 'solid',
      languages: ['ja'],
    }));
    const english = buildScripts(answersFor({ target: 'solid' }));

    expect(translated).toEqual(english);
  });

  it('compiles nothing for a language on a target with no i18n at all', () => {
    const translated = buildScripts(answersFor({
      target: 'webextension',
      surfaces: ['background'],
      languages: ['ja'],
    }));
    const english = buildScripts(answersFor({
      target: 'webextension',
      surfaces: ['background'],
    }));

    expect(translated).toEqual(english);
  });

  it('gives the linter a fix script beside its gate', () => {
    const scripts = buildScripts(answersFor({}));
    const expected = {
      'lint': 'eslint .',
      'lint:fix': 'eslint . --fix',
    };
    expect(scripts).toMatchObject(expected);
  });

  it('gives css a fix script beside its gate', () => {
    const scripts = buildScripts(answersFor({}));
    const expected = {
      'lint:css': 'stylelint "src/**/*.css" --allow-empty-input',
      'lint:css:fix': 'stylelint "src/**/*.css" --fix --allow-empty-input',
    };
    expect(scripts).toMatchObject(expected);

    const vueScripts = buildScripts(answersFor({ target: 'vue' }));
    const vueCss = {
      'lint:css': 'stylelint "src/**/*.{css,vue}" --allow-empty-input',
      'lint:css:fix': 'stylelint "src/**/*.{css,vue}" --fix --allow-empty-input',
    };
    expect(vueScripts).toMatchObject(vueCss);
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
    const scripts = buildScripts(answersFor({ target }));
    expect(scripts).toMatchObject(own);
  });

  it('writes the scripts React Router runs in framework mode', () => {
    const scripts = buildScripts({
      ...answersFor({ target: 'react' }),
      router: 'react-router-framework',
    });

    const expected = {
      typecheck: 'react-router typegen && tsc --noEmit',
      build: 'react-router build',
      dev: 'react-router dev',
      start: 'react-router-serve ./build/server/index.js',
      preview: 'react-router-serve ./build/server/index.js',
      prepare: 'react-router typegen && husky',
    };
    expect(scripts).toMatchObject(expected);
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
    const { prepare } = buildScripts(answersFor({}));
    expect(prepare).toBe('husky');
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
