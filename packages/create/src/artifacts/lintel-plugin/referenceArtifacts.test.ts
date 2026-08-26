import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type Library,
  type TargetId,
  type Testing,
  type TypeSafety,
} from '../../model/answers/answers';
import { contentOf } from '../../run/shipped-assets/shippedAssets';
import { type Artifact } from '../artifact/artifact';

import { referenceArtifacts } from './referenceArtifacts';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
  libraries?: Library[];
  typeSafety?: TypeSafety;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

const targetsOf = (overrides: AnswerOverrides): string[] => {
  return referenceArtifacts(answersFor(overrides)).map((artifact) => {
    return artifact.target;
  });
};

const find = (overrides: AnswerOverrides, target: string): Artifact | undefined => {
  return referenceArtifacts(answersFor(overrides)).find((artifact) => {
    return artifact.target === target;
  });
};

const sourcesOf = (artifact: Artifact | undefined): string[] => {
  return artifact !== undefined && 'sources' in artifact.content ? artifact.content.sources : [];
};

const reference = (name: string): string => {
  return `plugins/linteljs/skills/linteljs/references/${name}`;
};

describe('referenceArtifacts', () => {
  it('always carries the shared type standard and the target repo structure', () => {
    expect(targetsOf({})).toEqual(expect.arrayContaining([
      reference('type-standards.md'),
      reference('repo-structure.md'),
    ]));
  });

  it('names the repo structure source after the target', () => {
    const artifact = find({ target: 'svelte' }, reference('repo-structure.md'));

    expect(sourcesOf(artifact)).toEqual(['claude-rules/repo-structure.svelte.md']);
  });

  it('carries the state references for the target and none of another framework', () => {
    expect(targetsOf({ target: 'react' })).toContain(reference('react-state.md'));
    expect(targetsOf({ target: 'react' })).not.toContain(reference('vue-reactivity.md'));
    expect(targetsOf({ target: 'webextension' })).not.toEqual(expect.arrayContaining([
      expect.stringContaining('state'),
    ]));
  });

  it('adds the zod type reference only when zod is selected', () => {
    expect(targetsOf({})).not.toContain(reference('type-standards-zod.md'));
    expect(targetsOf({ libraries: ['zod'] })).toContain(reference('type-standards-zod.md'));
  });

  it('adds the testing reference from the target head and shared standard with a test runner', () => {
    const artifact = find({
      target: 'vue',
      testing: 'vitest',
    }, reference('testing.md'));

    expect(sourcesOf(artifact)).toEqual([
      'claude-rules/testing.vue.md',
      'claude-rules/testing.standard.md',
    ]);
  });

  it('drops the testing reference entirely when testing is declined', () => {
    expect(targetsOf({ testing: 'none' })).not.toContain(reference('testing.md'));
  });

  it('retains the relaxed type-safety section only when selected', () => {
    const strict = find({}, reference('type-standards.md'));
    const relaxed = find({ typeSafety: 'relaxed' }, reference('type-standards.md'));

    expect(sourcesOf(strict)).toEqual(['claude-rules/type-standards.md']);
    expect(sourcesOf(relaxed)).toEqual([
      'claude-rules/type-standards.md',
      'claude-rules/type-standards.relaxed.md',
    ]);
  });

  it('removes Claude path frontmatter from every emitted reference', async () => {
    const artifacts = referenceArtifacts({
      ...DEFAULT_ANSWERS,
      target: 'react',
      libraries: ['zod'],
    });
    const contents = await Promise.all(artifacts.map(async ({ content }) => {
      return await contentOf(content);
    }));

    for (const text of contents) {
      expect(text).not.toMatch(/^---\npaths:/u);
    }
  });
});
