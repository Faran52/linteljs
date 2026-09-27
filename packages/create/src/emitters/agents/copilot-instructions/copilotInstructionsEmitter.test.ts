import {
  answersFor,
  RULE,
  targets,
  transformOf,
  UNSCOPED,
} from '@mocks/agentRules';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { copilotArtifacts, copilotInstructionsEmitter } from './copilotInstructionsEmitter';

describe('copilotInstructionsEmitter', () => {
  it('writes the Copilot files only where Copilot was chosen', () => {
    expect(copilotInstructionsEmitter(answersFor(['claude-code', 'codex', 'cursor']))).toEqual([]);
    expect(targets(copilotInstructionsEmitter(answersFor(['copilot']))))
      .toEqual(targets(copilotArtifacts(answersFor(['copilot']))));
  });
});

describe('copilotArtifacts', () => {
  it('writes the repository-wide file and one path-scoped rule per source', () => {
    const written = targets(copilotArtifacts(answersFor(['copilot'])));

    expect(written).toContain('.github/copilot-instructions.md');
    expect(written).toContain('.github/instructions/repo-structure.instructions.md');
    expect(written).toContain('.github/instructions/type-standards.instructions.md');
  });

  it('rewrites the shared paths list as applyTo and drops the original frontmatter', () => {
    const transform = transformOf(
      copilotArtifacts(answersFor(['copilot'])),
      '.github/instructions/repo-structure.instructions.md',
    );

    expect(transform(RULE, null))
      .toBe('---\napplyTo: "src/**/*.ts,src/**/*.tsx,tsconfig.json"\n---\n\n# Repository Structure\n\nBody.\n');
  });

  it('installs the repository-wide file once and never rewrites it', () => {
    const [instructions] = copilotArtifacts(answersFor(['copilot']));

    expect(instructions?.stage).toBe('standard');
    expect(instructions?.preserve).toBe(true);
  });

  it('applies everywhere when the rule lists no paths', () => {
    const transform = transformOf(
      copilotArtifacts(answersFor(['copilot'])),
      '.github/instructions/type-standards.instructions.md',
    );

    expect(transform(UNSCOPED, null)).toBe('---\napplyTo: "**"\n---\n\nNo frontmatter here.\n');
  });
});
