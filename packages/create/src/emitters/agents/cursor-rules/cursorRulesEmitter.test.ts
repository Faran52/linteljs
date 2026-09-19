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

import { cursorArtifacts } from './cursorRulesEmitter';

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

  // Cursor spells "everywhere" as `alwaysApply`, so the glob key is absent rather than empty.
  it('always applies with no paths list, and falls back to a description when there is no heading', () => {
    const transform = transformOf(cursorArtifacts(answersFor(['cursor'])), '.cursor/rules/type-standards.mdc');

    expect(transform(UNSCOPED, null)).toBe(
      '---\ndescription: LintelJS project standard\nalwaysApply: true\n---\n\nNo frontmatter here.\n',
    );
  });
});
