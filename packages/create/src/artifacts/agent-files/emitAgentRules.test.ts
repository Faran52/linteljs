import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Agent,
  type Answers,
  DEFAULT_ANSWERS,
} from '../../model/answers/answers';
import { type Artifact } from '../artifact/artifact';

import { copilotArtifacts, cursorArtifacts } from './emitAgentRules';

const answersFor = (agents: Agent[]): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    agents,
  };
};

const targets = (artifacts: Artifact[]): string[] => {
  return artifacts.map((artifact) => {
    return artifact.target;
  });
};

// The `claude-rules/` source every agent is fed, frontmatter and all.
const RULE = '---\npaths:\n  - "src/**/*.{ts,tsx}"\n  - "tsconfig.json"\n---\n\n# Repository Structure\n\nBody.\n';

const transformOf = (artifacts: Artifact[], target: string): ((source: string, current: string | null) => string) => {
  const found = artifacts.find((artifact) => {
    return artifact.target === target;
  });

  if (found === undefined || !('sources' in found.content) || found.content.transform === undefined) {
    throw new Error(`no transform for ${target}`);
  }

  return found.content.transform;
};

describe('copilotArtifacts', () => {
  it('writes the repository-wide file and one path-scoped rule per source', () => {
    const written = targets(copilotArtifacts(answersFor(['copilot'])));

    expect(written).toContain('.github/copilot-instructions.md');
    expect(written).toContain('.github/instructions/repo-structure.instructions.md');
    expect(written).toContain('.github/instructions/type-standards.instructions.md');
  });

  // `applyTo` is the key Copilot reads, and it takes the globs as one comma-separated string.
  it('rewrites the shared paths list as applyTo and drops the original frontmatter', () => {
    const transform = transformOf(
      copilotArtifacts(answersFor(['copilot'])),
      '.github/instructions/repo-structure.instructions.md',
    );

    expect(transform(RULE, null))
      .toBe('---\napplyTo: "src/**/*.{ts,tsx},tsconfig.json"\n---\n\n# Repository Structure\n\nBody.\n');
  });

  // Never overwritten: a project's own instructions outrank a re-run.
  it('installs the repository-wide file once and never rewrites it', () => {
    const [instructions] = copilotArtifacts(answersFor(['copilot']));

    expect(instructions?.preserve).toBe(true);
  });
});

describe('cursorArtifacts', () => {
  it('writes every rule under .cursor/rules with the mdc suffix', () => {
    const written = targets(cursorArtifacts(answersFor(['cursor'])));

    expect(written).toContain('.cursor/rules/linteljs.mdc');
    expect(written).toContain('.cursor/rules/repo-structure.mdc');
    expect(written).not.toContain('.github/copilot-instructions.md');
  });

  // Cursor has no repository-wide file, so the adapter is a rule that always applies.
  it('carries the adapter as an always-applied rule', () => {
    const [always] = cursorArtifacts(answersFor(['cursor']));

    expect(always?.content).toHaveProperty('text', expect.stringContaining('alwaysApply: true'));
    expect(always?.preserve).toBe(true);
  });

  // `description` comes from the rule's own first heading, so no second wording exists to drift.
  it('rewrites the shared paths list as globs and takes the description from the heading', () => {
    const output = transformOf(cursorArtifacts(answersFor(['cursor'])), '.cursor/rules/repo-structure.mdc')(RULE, null);

    expect(output).toBe(
      '---\ndescription: Repository Structure\nglobs: src/**/*.{ts,tsx},tsconfig.json\nalwaysApply: false\n---\n\n'
      + '# Repository Structure\n\nBody.\n',
    );
  });
});

// Three shipped rules carry no `paths:` list, because they govern any file rather than a set of them.
describe('a rule with no paths list', () => {
  const UNSCOPED = 'No frontmatter here.\n';

  it('applies everywhere for Copilot', () => {
    const transform = transformOf(
      copilotArtifacts(answersFor(['copilot'])),
      '.github/instructions/type-standards.instructions.md',
    );

    expect(transform(UNSCOPED, null)).toBe('---\napplyTo: "**"\n---\n\nNo frontmatter here.\n');
  });

  // Cursor spells "everywhere" as `alwaysApply`, so the glob key is absent rather than empty.
  it('always applies for Cursor, and falls back to a description when there is no heading', () => {
    const transform = transformOf(cursorArtifacts(answersFor(['cursor'])), '.cursor/rules/type-standards.mdc');

    expect(transform(UNSCOPED, null)).toBe(
      '---\ndescription: LintelJS project standard\nalwaysApply: true\n---\n\nNo frontmatter here.\n',
    );
  });
});
