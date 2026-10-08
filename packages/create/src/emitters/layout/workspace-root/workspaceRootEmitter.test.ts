import { hostedAnswersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { shippedAssetsReader } from '@disk';

import { type PackageJson, parsePackageJson } from '../../utils/packageJsonUtils';

import { workspaceRootEmitter } from './workspaceRootEmitter';

import type { HostedAnswers, PackageManager } from '@config/types';

const textAt = async (overrides: Partial<HostedAnswers>, target: string): Promise<string> => {
  const answers = hostedAnswersFor({
    layout: 'monorepo',
    ...overrides,
  });

  const artifact = workspaceRootEmitter(answers, EMPTY_PROJECT, '@acme/shop')
    .find((candidate) => {
      return candidate.target === target;
    });

  return artifact === undefined ? '' : await shippedAssetsReader(artifact.content);
};

const manifestOf = async (overrides: Partial<HostedAnswers>): Promise<PackageJson> => {
  const text = await textAt(overrides, 'package.json');
  const manifest = parsePackageJson(text);

  return manifest;
};

describe('workspaceRootEmitter', () => {
  it('writes nothing for a single repo', () => {
    const artifacts = workspaceRootEmitter(hostedAnswersFor({}), EMPTY_PROJECT, 'shop');
    expect(artifacts).toEqual([]);
  });

  it('writes the root tooling of a monorepo', () => {
    const answers = hostedAnswersFor({ layout: 'monorepo' });

    const targets = workspaceRootEmitter(answers, EMPTY_PROJECT, 'shop')
      .map((artifact) => {
        return `${artifact.stage} ${artifact.target}`;
      });

    expect(targets).toEqual([
      'package package.json',
      'lint eslint.config.ts',
      'package tsconfig.json',
      'package .gitignore',
      'standard lint-staged.config.js',
    ]);
  });

  it.each<[PackageManager, string]>([
    ['pnpm', 'pnpm lint && pnpm typecheck && pnpm -r --if-present run check'],
    ['npm', 'npm run lint && npm run typecheck && npm run check --workspaces --if-present'],
    ['yarn', 'yarn lint && yarn typecheck && yarn workspaces foreach -A --exclude @acme/shop-workspace run check'],
    ['bun', 'bun run lint && bun run typecheck && bun run --workspaces --if-present check'],
  ])('runs the root gates then every workspace check on %s', async (packageManager, check) => {
    const manifest = await manifestOf({ packageManager });
    expect(manifest.scripts?.['check']).toBe(check);
  });

  it('names the root apart from the app and lists the workspaces where pnpm does not', async () => {
    const pnpm = await manifestOf({});
    expect(pnpm.name).toBe('@acme/shop-workspace');
    expect(pnpm.workspaces).toBeUndefined();
    expect(pnpm.packageManager).toMatch(/^pnpm@/u);
    expect(pnpm.private).toBe(true);
    expect(pnpm.type).toBe('module');

    expect(pnpm.scripts).toEqual({
      'lint': 'eslint . --concurrency auto',
      'lint:fix': 'eslint . --fix --concurrency auto',
      'typecheck': 'tsc --noEmit',
      'check': 'pnpm lint && pnpm typecheck && pnpm -r --if-present run check',
      'prepare': 'husky',
    });

    const npm = await manifestOf({ packageManager: 'npm' });
    expect(npm.workspaces).toEqual(['apps/*', 'packages/*']);
    expect(npm.allowScripts).toBeDefined();

    const yarn = await manifestOf({ packageManager: 'yarn' });
    expect(yarn.scripts?.['postinstall']).toBe('husky');
  });

  it('points msw at the app, since its install script reads the root manifest', async () => {
    const react = await manifestOf({ mocking: 'msw' });
    const svelte = await manifestOf({
      mocking: 'msw',
      target: 'svelte',
    });
    const none = await manifestOf({});

    expect(react.msw).toEqual({ workerDirectory: ['apps/shop/public'] });
    expect(svelte.msw).toEqual({ workerDirectory: ['apps/shop/static'] });
    expect(none.msw).toBeUndefined();
  });

  it('installs only the root tooling', async () => {
    const { devDependencies = {} } = await manifestOf({});

    const names = Object.keys(devDependencies);

    expect(names).toEqual([
      '@commitlint/cli',
      '@commitlint/config-conventional',
      '@linteljs/eslint-config',
      '@types/node',
      'eslint',
      'husky',
      'jiti',
      'lint-staged',
      'typescript',
    ]);
  });

  it('lints and typechecks the root, leaving every workspace to itself', async () => {
    const eslintConfig = await textAt({}, 'eslint.config.ts');
    expect(eslintConfig).toContain('\'apps/**\',\n    \'packages/**\',');
    expect(eslintConfig).not.toContain('vitest');

    const tsconfig = await textAt({}, 'tsconfig.json');
    expect(tsconfig).toContain('"apps",\n    "packages"\n');
  });

  it('stages the root files without stylelint, which only a workspace installs', async () => {
    const lintStaged = await textAt({}, 'lint-staged.config.js');
    expect(lintStaged).toContain('node scripts/checkBannedPatterns.ts');
    expect(lintStaged).not.toContain('stylelint');
    expect(lintStaged).toContain('  },\n};\n');
  });

  it('ignores what every project ignores, and yarn its own files', async () => {
    const pnpm = await textAt({}, '.gitignore');
    expect(pnpm).toContain('node_modules/');
    expect(pnpm).not.toContain('.yarn/*');

    const yarn = await textAt({ packageManager: 'yarn' }, '.gitignore');
    expect(yarn).toContain('.yarn/*');
  });
});
