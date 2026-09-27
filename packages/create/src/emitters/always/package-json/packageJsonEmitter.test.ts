import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  EMPTY_PROJECT,
  MANAGER_FLOORS,
  NODE_ENGINE,
} from '@config/constants';

import { DEFAULT_ANSWERS } from '@answers';

import { VERSIONS } from '../../constants';
import { type PackageJson, parsePackageJson } from '../../utils/packageJsonUtils';

import { packageJsonEmitter, patchPackageJson } from './packageJsonEmitter';

import type { TargetId } from '@config/types';

// What a scaffolder leaves on disk before this package edits it.
const SCAFFOLDED: PackageJson = {
  name: 'demo-app',
  version: '0.0.0',
  private: true,
  dependencies: {
    'react': '^19.2.0',
    // A dependency this CLI neither pins nor supersedes, which is what a project's own looks like.
    'date-fns': '^4.1.0',
  },
  devDependencies: {
    vite: '^7.2.0',
    prettier: '^3.6.0',
  },
  scripts: {
    dev: 'vite',
    build: 'vite build',
    lint: 'vite lint',
  },
};

/*
 * The mocking answer reaches the manifest in three places, and two of them are easy to forget: the install script
 * that copies the worker has to be allowed, or the install stops and asks, and the key naming where it goes has to
 * be there, or MSW copies it nowhere.
 */
describe('the mocking answer', () => {
  // The directory each dev server serves as it is, which is where a browser fetches the worker from.
  it.each<[TargetId, string]>([
    ['react', 'public'],
    ['next', 'public'],
    ['vue', 'public'],
    ['nuxt', 'public'],
    ['svelte', 'static'],
    ['solid', 'public'],
    ['angular', 'public'],
    ['astro', 'public'],
  ])('puts the %s worker in %s', (target, directory) => {
    expect(patchPackageJson({}, answersFor({
      target,
      mocking: 'msw',
    }))).toMatchObject({ msw: { workerDirectory: [directory] } });
  });

  // The served directory, which is where a browser fetches the worker from and differs per target.
  it('names the worker directory for a target that serves one, and omits the key otherwise', () => {
    expect(patchPackageJson({}, answersFor({
      target: 'react',
      mocking: 'msw',
    })))
      .toMatchObject({ msw: { workerDirectory: ['public'] } });
    expect(patchPackageJson({}, answersFor({ target: 'react' }))).not.toHaveProperty('msw');
    expect(patchPackageJson({}, answersFor({
      target: 'react-native',
      mocking: 'msw',
    })))
      .not.toHaveProperty('msw');
  });
});

describe('patchPackageJson', () => {
  it('removes recorded linteljs metadata and preserves unrelated package properties', () => {
    const existing = {
      name: 'demo',
      description: 'kept',
      linteljs: { target: DEFAULT_ANSWERS.target },
    };
    const patched = patchPackageJson(existing, DEFAULT_ANSWERS);

    expect(patched).not.toHaveProperty('linteljs');
    expect(patched).toHaveProperty('description', 'kept');
  });

  it('drops prettier, which @stylistic supersedes', () => {
    expect(patchPackageJson(SCAFFOLDED, answersFor({})).devDependencies).not.toHaveProperty(
      'prettier',
    );
  });

  // What @linteljs/eslint-config replaces, and the two create-vue installs for a config and an environment it replaced.
  it('drops every package the standard supersedes from the tools a project declared', () => {
    const superseded = [
      'prettier',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      '@eslint/js',
      'globals',
      'typescript-eslint',
      'eslint-plugin-react-refresh',
      'oxlint',
      'vite-plugin-vue-devtools',
      'jsdom',
    ];
    const declared = Object.fromEntries(superseded.map((name) => {
      return [name, '^1.0.0'];
    }));
    const patched = patchPackageJson({ devDependencies: declared }, answersFor({}));

    expect(superseded.filter((name) => {
      return name in (patched.devDependencies ?? {});
    })).toEqual([]);
  });

  // Three declarations of one fact: the exact version corepack and pnpm switch to, the floor that was tested, and
  // the field npm and pnpm refuse the install over.
  it('sets type, and declares the recorded manager version three ways', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({
      packageManager: 'pnpm',
      packageManagerVersion: '12.5.1',
    }));

    expect(patched.type).toBe('module');
    expect(patched.packageManager).toBe('pnpm@12.5.1');
    // 22.18 is the first Node that strips types by default, which the shipped `scripts/*.ts` and hooks run on.
    expect(patched.engines).toEqual({
      node: '>=22.18',
      pnpm: `>=${MANAGER_FLOORS.pnpm}`,
    });
    expect(patched.devEngines).toEqual({
      packageManager: {
        name: 'pnpm',
        onFail: 'error',
      },
    });
  });

  // A `packageManager: bun@x` is a field corepack would act on and cannot, so bun is told through `engines` alone.
  it('writes no packageManager field for bun', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({
      packageManager: 'bun',
      packageManagerVersion: '1.3.4',
    }));

    expect(patched).not.toHaveProperty('packageManager');
    expect(patched.engines).toEqual({
      node: NODE_ENGINE,
      bun: `>=${MANAGER_FLOORS.bun}`,
    });
    expect(patched.devEngines?.['packageManager']).toEqual({
      name: 'bun',
      onFail: 'error',
    });
  });

  // Expo Router is the entry, where every other target's bundler finds its own.
  it('names the entry only for the target whose runtime reads it', () => {
    expect(patchPackageJson({}, answersFor({ target: 'react-native' }))).toHaveProperty('main', 'expo-router/entry');
    expect(patchPackageJson({}, answersFor({}))).not.toHaveProperty('main');
  });

  it('marks every generated project private', () => {
    expect(patchPackageJson({}, answersFor({})).private).toBe(true);
    expect(patchPackageJson({ private: false }, answersFor({})).private).toBe(true);
  });

  // Measured on bun 1.3.11: a `bunfig.toml` `allowBuilds` key is ignored and the postinstall stays blocked; only
  // `trustedDependencies` in package.json is read.
  it('names every approved build in trustedDependencies for bun and nothing for the other managers', () => {
    const bun = patchPackageJson({}, answersFor({
      target: 'react-native',
      packageManager: 'bun',
    }));

    expect(bun.trustedDependencies).toEqual(expect.arrayContaining(['sharp', 'unrs-resolver', 'esbuild']));
    expect(patchPackageJson({}, answersFor({ packageManager: 'pnpm' }))).not.toHaveProperty('trustedDependencies');
  });

  // npm 12 blocks unlisted install scripts and warns; `.npmrc` `allow-scripts` is ignored once package.json has it.
  it('approves every build for npm, keeps what the scaffolder approved, and writes nothing elsewhere', () => {
    const npm = patchPackageJson({ allowScripts: { 'some-native': true } }, answersFor({
      target: 'angular',
      packageManager: 'npm',
    }));

    expect(npm.allowScripts).toMatchObject({
      'some-native': true,
      'esbuild': true,
      'lmdb': true,
      'fsevents': true,
      'unrs-resolver': true,
    });
    expect(patchPackageJson({}, answersFor({ packageManager: 'pnpm' }))).not.toHaveProperty('allowScripts');
  });
});

describe('packageJsonEmitter', () => {
  // With nothing on disk the file is born, and the project name is the one thing only the caller knows.
  it('names a package.json it writes from nothing after the project', () => {
    const [artifact] = packageJsonEmitter(DEFAULT_ANSWERS, EMPTY_PROJECT, 'demo-app');
    const born = parsePackageJson(
      artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(null) : '{}',
    );

    expect(born.name).toBe('demo-app');
  });

  it('leaves the dependencies and scripts it does not own intact in the file on disk', () => {
    const [artifact] = packageJsonEmitter(DEFAULT_ANSWERS, EMPTY_PROJECT, 'demo-app');
    // `date-fns` is a dependency this CLI neither pins nor supersedes, which is what a project's own looks like.
    const scaffolded = JSON.stringify({
      name: 'demo-app',
      dependencies: {
        'react': '^19.2.0',
        'date-fns': '^4.1.0',
      },
      devDependencies: { 'some-tool': '^1.0.0' },
      scripts: { dev: 'vite' },
    });
    const patched = parsePackageJson(
      artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(scaffolded) : '{}',
    );

    expect(patched.dependencies?.['date-fns']).toBe('^4.1.0');
    // A merge, not an overwrite, for the dev tools a project declared too.
    expect(patched.devDependencies?.['some-tool']).toBe('^1.0.0');
    // Nothing fetches React, so this CLI is what installs it.
    expect(patched.dependencies?.['react']).toBe(VERSIONS['react']);
    expect(patched.scripts?.['dev']).toBe('vite');
    expect(patched.scripts?.['lint']).toBe('eslint .');
  });
});
