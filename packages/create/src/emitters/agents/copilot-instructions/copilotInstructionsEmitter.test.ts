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
    const copilotInstructions = copilotInstructionsEmitter(answersFor([
      'claude-code',
      'codex',
      'cursor',
    ]));
    expect(copilotInstructions).toEqual([]);

    const emitted = copilotInstructionsEmitter(answersFor(['copilot']));
    const actual = targets(emitted);
    const built = copilotArtifacts(answersFor(['copilot']));
    const expected = targets(built);

    expect(actual).toEqual(expected);
  });
});

describe('copilotArtifacts', () => {
  it('writes the repository-wide file and one path-scoped rule per source', () => {
    const artifacts = copilotArtifacts(answersFor(['copilot']));
    const written = targets(artifacts);

    expect(written).toContain('.github/copilot-instructions.md');
    expect(written).toContain('.github/instructions/repo-structure.instructions.md');
    expect(written).toContain('.github/instructions/type-standards.instructions.md');
  });

  it('rewrites the shared paths list as applyTo and drops the original frontmatter', () => {
    const artifacts = copilotArtifacts(answersFor(['copilot']));
    const transform = transformOf(artifacts, '.github/instructions/repo-structure.instructions.md');

    const transformed = transform(RULE, null);

    expect(transformed)
      .toBe('---\napplyTo: "src/**/*.ts,src/**/*.tsx,tsconfig.json"\n---\n\n# Repository Structure\n\nBody.\n');
  });

  it('scopes applyTo to every package of a monorepo', () => {
    const answers = {
      ...answersFor(['copilot']),
      layout: 'monorepo' as const,
    };
    const artifacts = copilotArtifacts(answers);
    const transform = transformOf(artifacts, '.github/instructions/repo-structure.instructions.md');

    const transformed = transform(RULE, null);

    expect(transformed).toContain('applyTo: "**/src/**/*.ts,**/src/**/*.tsx,**/tsconfig.json"');
  });

  it('installs the repository-wide file once and never rewrites it', () => {
    const [instructions] = copilotArtifacts(answersFor(['copilot']));

    expect(instructions?.stage).toBe('standard');
    expect(instructions?.preserve).toBe(true);
  });

  it('applies everywhere when the rule lists no paths', () => {
    const artifacts = copilotArtifacts(answersFor(['copilot']));
    const transform = transformOf(artifacts, '.github/instructions/type-standards.instructions.md');

    const transformed = transform(UNSCOPED, null);
    expect(transformed).toBe('---\napplyTo: "**"\n---\n\nNo frontmatter here.\n');
  });
});
