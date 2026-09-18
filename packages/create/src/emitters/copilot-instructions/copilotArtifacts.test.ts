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

import { copilotArtifacts } from './copilotArtifacts';

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

  // A rule with no paths list governs any file, which is what Copilot reads `**` as.
  it('applies everywhere when the rule lists no paths', () => {
    const transform = transformOf(
      copilotArtifacts(answersFor(['copilot'])),
      '.github/instructions/type-standards.instructions.md',
    );

    expect(transform(UNSCOPED, null)).toBe('---\napplyTo: "**"\n---\n\nNo frontmatter here.\n');
  });
});
