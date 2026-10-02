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

import {
  packageJsonEmitter,
  patchPackageJson,
  resyncPackageJson,
} from './packageJsonEmitter';

import type { TargetId } from '@config/types';

const SCAFFOLDED: PackageJson = {
  name: 'demo-app',
  version: '0.0.0',
  private: true,
  dependencies: {
    'react': '^19.2.0',
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

describe('the mocking answer', () => {
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
    const patched = patchPackageJson({}, answersFor({
      target,
      mocking: 'msw',
    }));

    expect(patched).toMatchObject({ msw: { workerDirectory: [directory] } });
  });

  it('names the worker directory for a target that serves one, and omits the key otherwise', () => {
    const onReact = patchPackageJson({}, answersFor({
      target: 'react',
      mocking: 'msw',
    }));

    expect(onReact).toMatchObject({ msw: { workerDirectory: ['public'] } });
    expect(patchPackageJson({}, answersFor({ target: 'react' }))).not.toHaveProperty('msw');

    const onNative = patchPackageJson({}, answersFor({
      target: 'react-native',
      mocking: 'msw',
    }));

    expect(onNative).not.toHaveProperty('msw');
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
    const declared = Object.fromEntries(superseded
      .map((name) => {
        return [name, '^1.0.0'];
      }));
    const patched = patchPackageJson({ devDependencies: declared }, answersFor({}));

    const kept = superseded
      .filter((name) => {
        return name in (patched.devDependencies ?? {});
      });

    expect(kept).toEqual([]);
  });

  it('sets type, and declares the recorded manager version three ways', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({
      packageManager: 'pnpm',
      packageManagerVersion: '12.5.1',
    }));

    expect(patched.type).toBe('module');
    expect(patched.packageManager).toBe('pnpm@12.5.1');

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

  it('names the entry only for the target whose runtime reads it', () => {
    expect(patchPackageJson({}, answersFor({ target: 'react-native' }))).toHaveProperty('main', 'expo-router/entry');
    expect(patchPackageJson({}, answersFor({}))).not.toHaveProperty('main');
  });

  it('marks every generated project private', () => {
    expect(patchPackageJson({}, answersFor({})).private).toBe(true);
    expect(patchPackageJson({ private: false }, answersFor({})).private).toBe(true);
  });

  it('names every approved build in trustedDependencies for bun and nothing for the other managers', () => {
    const bun = patchPackageJson({}, answersFor({
      target: 'react-native',
      packageManager: 'bun',
    }));

    expect(bun.trustedDependencies).toEqual(expect.arrayContaining([
      'sharp',
      'unrs-resolver',
      'esbuild',
    ]));

    expect(patchPackageJson({}, answersFor({ packageManager: 'pnpm' }))).not.toHaveProperty('trustedDependencies');
  });

  it.each([
    [
      'npm',
      'overrides',
      'react-native-css',
      { lightningcss: VERSIONS['lightningcss'] },
    ],
    [
      'bun',
      'overrides',
      'lightningcss',
      VERSIONS['lightningcss'],
    ],
    [
      'yarn',
      'resolutions',
      '@expo/metro-config/lightningcss',
      VERSIONS['lightningcss'],
    ],
  ] as const)('pins lightningcss for NativeWind under %s in %s, keeping its own', (packageManager, field, key, pin) => {
    const patched = patchPackageJson({ [field]: { 'left-pad': '1.0.0' } }, answersFor({
      target: 'react-native',
      styling: 'tailwind',
      packageManager,
    }));

    expect(patched[field]).toMatchObject({
      'left-pad': '1.0.0',
      [key]: pin,
    });
  });

  it('writes no override field under pnpm, nor without NativeWind', () => {
    const pnpm = patchPackageJson({}, answersFor({
      target: 'react-native',
      styling: 'tailwind',
      packageManager: 'pnpm',
    }));
    const plain = patchPackageJson({}, answersFor({
      target: 'react-native',
      packageManager: 'npm',
    }));

    expect(pnpm).not.toHaveProperty('overrides');
    expect(pnpm).not.toHaveProperty('resolutions');
    expect(plain).not.toHaveProperty('overrides');
  });

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
  it('names a package.json it writes from nothing after the project', () => {
    const [artifact] = packageJsonEmitter(DEFAULT_ANSWERS, EMPTY_PROJECT, 'demo-app');
    const born = parsePackageJson(
      artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(null) : '{}',
    );

    expect(born.name).toBe('demo-app');
  });

  it('leaves the dependencies and scripts it does not own intact in the file on disk', () => {
    const [artifact] = packageJsonEmitter(DEFAULT_ANSWERS, EMPTY_PROJECT, 'demo-app');
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
    expect(patched.devDependencies?.['some-tool']).toBe('^1.0.0');
    expect(patched.dependencies?.['react']).toBe(VERSIONS['react']);
    expect(patched.scripts?.['dev']).toBe('vite');
    expect(patched.scripts?.['lint']).toBe('eslint .');
  });
});

describe('resyncPackageJson', () => {
  const scaffolded = `${JSON.stringify({
    name: 'demo-app',
    dependencies: { react: '^99.0.0' },
    devDependencies: { '@linteljs/eslint-config': '^1.0.0' },
  })}\n`;

  it('moves only the @linteljs/* version, keeping the framework the project bumped', () => {
    const [artifact] = packageJsonEmitter(answersFor({}), { setupTests: [], styleEntries: [] }, 'demo-app');
    const resynced = artifact !== undefined && 'resync' in artifact.content
      ? artifact.content.resync(scaffolded)
      : '';
    const synced = parsePackageJson(resynced);

    expect(synced.dependencies).toEqual({ react: '^99.0.0' });
    expect(synced.devDependencies).toEqual({ '@linteljs/eslint-config': VERSIONS['@linteljs/eslint-config'] });
    expect(synced.scripts).toBeUndefined();
  });

  it('hands back the bytes it was given when nothing of linteljs is behind', () => {
    const current = '{ "devDependencies": { "@linteljs/eslint-config": "^9.0.0" } }';

    expect(resyncPackageJson(current, answersFor({}))).toBe(current);
  });
});
