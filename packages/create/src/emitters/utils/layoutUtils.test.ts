import { hostedAnswersFor } from '@mocks/answersFor';
import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitted } from './artifactUtils';
import {
  atRoot,
  inProject,
  packageAnswersOf,
  rootCheckOf,
  rootNameOf,
  workspaceOf,
} from './layoutUtils';

import type { Artifact, HostedAnswers } from '@config/types';

const artifactsFor = (): Artifact[] => {
  const artifacts = [
    emitted('standard', 'package.json', ''),
    emitted('standard', 'src/main.ts', ''),
    emitted('standard', '.claude/rules/testing.md', ''),
    emitted('standard', 'plugins/linteljs/managed.json', ''),
    emitted('standard', 'scripts/checkBannedPatterns.ts', ''),
    emitted('standard', 'README.md', ''),
    emitted('standard', 'docs/README.md', ''),
    {
      ...emitted('standard', 'src/main.test.ts', ''),
      requires: ['src/main.ts', 'scripts/checkBannedPatterns.ts'],
    },
  ];

  return artifacts;
};

describe('inProject', () => {
  it('leaves a single repo as it is', () => {
    const written = artifactsFor();
    const artifacts = inProject('.', written);
    expect(artifacts).toBe(written);
  });

  it('moves every artifact but the root tooling under its directory', () => {
    const artifacts = inProject('apps/shop', artifactsFor());

    const targets = artifacts
      .map((artifact) => {
        return artifact.target;
      });

    expect(targets).toEqual([
      'apps/shop/package.json',
      'apps/shop/src/main.ts',
      '.claude/rules/testing.md',
      'plugins/linteljs/managed.json',
      'scripts/checkBannedPatterns.ts',
      'README.md',
      'apps/shop/docs/README.md',
      'apps/shop/src/main.test.ts',
    ]);

    const requires = artifacts
      .map((artifact) => {
        return artifact.requires;
      });

    expect(requires).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ['apps/shop/src/main.ts', 'scripts/checkBannedPatterns.ts'],
    ]);

    const withRequires = artifacts
      .filter((artifact) => {
        return 'requires' in artifact;
      });

    expect(withRequires).toHaveLength(1);
  });

  it('keeps the Gemini CLI settings at the root in a monorepo, beside the plugins/ its hooks run', () => {
    const written = [emitted('standard', '.gemini/settings.json', '')];
    const artifacts = inProject('apps/shop', written);

    const targets = artifacts
      .map((artifact) => {
        return artifact.target;
      });

    expect(targets).toEqual(['.gemini/settings.json']);
  });

  it('keeps every workspace root file at the root in a monorepo', () => {
    const rootFiles = [
      'AGENTS.md',
      'CLAUDE.md',
      'README.md',
      'bunfig.toml',
      'commitlint.config.js',
      'linteljs.config.json',
      'pnpm-workspace.yaml',
      '.yarnrc.yml',
    ];
    const written = rootFiles
      .map((target) => {
        return emitted('standard', target, '');
      });
    const artifacts = inProject('apps/shop', written);

    const targets = artifacts
      .map((artifact) => {
        return artifact.target;
      });

    expect(targets).toEqual(rootFiles);
  });
});

describe('packageAnswersOf', () => {
  it('keeps the workspace\'s manager, Node and type safety, and defaults the rest for a package', () => {
    const workspace: HostedAnswers = {
      ...HOSTED_DEFAULTS,
      target: 'react',
      layout: 'monorepo',
      packageManager: 'yarn',
      packageManagerVersion: '4.9.0',
      nodeVersion: '24.1.0',
      typeSafety: 'relaxed',
      testing: 'none',
      libraries: ['zod'],
      agents: ['codex'],
    };

    const project = packageAnswersOf(workspace);

    expect(project).toEqual({
      ...HOSTED_DEFAULTS,
      target: 'typescript',
      layout: 'monorepo',
      packageManager: 'yarn',
      packageManagerVersion: '4.9.0',
      nodeVersion: '24.1.0',
      typeSafety: 'relaxed',
    });
  });
});

describe('atRoot', () => {
  it('holds a root file and a root directory\'s contents at the root, and nothing else', () => {
    const rooted = [
      'README.md',
      '.claude/rules/testing.md',
      'src/main.ts',
    ]
      .map(atRoot);

    expect(rooted).toEqual([
      true,
      true,
      false,
    ]);
  });
});

describe('workspaceOf', () => {
  it('gives every project the first project\'s workspace answers and keeps its own', () => {
    const first = hostedAnswersFor({
      layout: 'monorepo',
      packageManager: 'pnpm',
      target: 'react',
    });
    const second = hostedAnswersFor({
      layout: 'single',
      packageManager: 'npm',
      target: 'vue',
    });

    const workspace = workspaceOf('acme', [
      { name: 'web', answers: first },
      { name: 'admin', answers: second },
    ]);

    const [kept, aligned] = workspace.projects;

    expect(workspace.name).toBe('acme');
    expect(kept.answers).toBe(first);
    expect(aligned?.name).toBe('admin');
    expect(aligned?.answers.target).toBe('vue');
    expect(aligned?.answers.layout).toBe('monorepo');
    expect(aligned?.answers.packageManager).toBe('pnpm');
  });
});

describe('rootNameOf', () => {
  it('names the root apart from the app', () => {
    const rootName = rootNameOf('@acme/shop');

    expect(rootName).toBe('@acme/shop-workspace');
  });
});

describe('rootCheckOf', () => {
  it.each([
    ['pnpm', 'pnpm lint && pnpm typecheck && pnpm -r --if-present run check'],
    ['npm', 'npm run lint && npm run typecheck && npm run check --workspaces --if-present'],
    ['yarn', 'yarn lint && yarn typecheck && yarn workspaces foreach -A --exclude @acme/shop-workspace run check'],
    ['bun', 'bun run lint && bun run typecheck && bun run --workspaces --if-present check'],
  ] as const)('runs the root gates then every workspace check on %s', (packageManager, check) => {
    const rootCheck = rootCheckOf(packageManager, '@acme/shop');

    expect(rootCheck).toBe(check);
  });
});
