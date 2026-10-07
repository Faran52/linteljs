import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitted } from './artifactUtils';
import { inLayout } from './layoutUtils';

import type { Artifact } from '@config/types';

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
});
