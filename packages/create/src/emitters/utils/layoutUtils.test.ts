import { answersFor } from '@mocks/answersFor';
import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitted } from './artifactUtils';
import {
  inLayout,
  inPackage,
  libraryAnswersOf,
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

describe('inLayout', () => {
  it('leaves a single repo as it is', () => {
    const written = artifactsFor();
    const artifacts = inLayout(answersFor({}), '@acme/shop', written);
    expect(artifacts).toBe(written);
  });

  it('moves every artifact but the root tooling under apps/<name> in a monorepo', () => {
    const artifacts = inLayout(answersFor({ layout: 'monorepo' }), '@acme/shop', artifactsFor());

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
    const artifacts = inLayout(answersFor({ layout: 'monorepo' }), '@acme/shop', written);

    const targets = artifacts
      .map((artifact) => {
        return artifact.target;
      });

    expect(targets).toEqual(rootFiles);
  });
});

describe('libraryAnswersOf', () => {
  it('keeps the workspace\'s manager, Node and type safety, and defaults the rest for a library', () => {
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

    const library = libraryAnswersOf(workspace);

    expect(library).toEqual({
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

describe('inPackage', () => {
  it('keeps only the app directory\'s artifacts, moved under packages/<name>', () => {
    const answers = answersFor({ layout: 'monorepo' });
    const laidOut = inLayout(answers, 'lib', artifactsFor());
    const artifacts = inPackage(answers, 'lib', laidOut);

    const targets = artifacts
      .map((artifact) => {
        return artifact.target;
      });

    expect(targets).toEqual([
      'packages/lib/package.json',
      'packages/lib/src/main.ts',
      'packages/lib/docs/README.md',
      'packages/lib/src/main.test.ts',
    ]);

    const requires = artifacts
      .map((artifact) => {
        return artifact.requires;
      });

    expect(requires).toEqual([
      undefined,
      undefined,
      undefined,
      ['packages/lib/src/main.ts', 'scripts/checkBannedPatterns.ts'],
    ]);

    const withRequires = artifacts
      .filter((artifact) => {
        return 'requires' in artifact;
      });

    expect(withRequires).toHaveLength(1);
  });

  it('keeps nothing whose path only shares the app directory\'s prefix', () => {
    const answers = answersFor({ layout: 'monorepo' });
    const artifacts = inPackage(answers, 'lib', [emitted('standard', 'apps/library/package.json', '')]);

    expect(artifacts).toEqual([]);
  });
});
