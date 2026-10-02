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

import { cursorArtifacts, cursorRulesEmitter } from './cursorRulesEmitter';

describe('cursorRulesEmitter', () => {
  it('writes the Cursor rules only where Cursor was chosen', () => {
    const cursorRules = cursorRulesEmitter(answersFor([
      'claude-code',
      'codex',
      'copilot',
    ]));
    expect(cursorRules).toEqual([]);

    const emitted = cursorRulesEmitter(answersFor(['cursor']));
    const actual = targets(emitted);
    const built = cursorArtifacts(answersFor(['cursor']));
    const expected = targets(built);

    expect(actual).toEqual(expected);
  });
});

describe('cursorArtifacts', () => {
  it('writes every rule under .cursor/rules with the mdc suffix', () => {
    const artifacts = cursorArtifacts(answersFor(['cursor']));
    const written = targets(artifacts);

    expect(written).toContain('.cursor/rules/linteljs.mdc');
    expect(written).toContain('.cursor/rules/repo-structure.mdc');
    expect(written).not.toContain('.github/copilot-instructions.md');
  });

  it('carries the adapter as an always-applied rule', () => {
    const [always] = cursorArtifacts(answersFor(['cursor']));

    expect(always?.stage).toBe('standard');
    expect(always?.content).toHaveProperty('text', expect.stringContaining('alwaysApply: true'));
    expect(always?.preserve).toBe(true);
  });

  it('rewrites the shared paths list as globs and takes the description from the heading', () => {
    const artifacts = cursorArtifacts(answersFor(['cursor']));
    const transform = transformOf(artifacts, '.cursor/rules/repo-structure.mdc');
    const output = transform(RULE, null);

    expect(output).toBe(
      '---\ndescription: Repository Structure\nglobs: src/**/*.ts,src/**/*.tsx,tsconfig.json\n'
      + 'alwaysApply: false\n---\n\n'
      + '# Repository Structure\n\nBody.\n',
    );
  });

  it('always applies with no paths list, and falls back to a description when there is no heading', () => {
    const artifacts = cursorArtifacts(answersFor(['cursor']));
    const transform = transformOf(artifacts, '.cursor/rules/type-standards.mdc');

    const transformed = transform(UNSCOPED, null);

    expect(transformed).toBe(
      '---\ndescription: LintelJS project standard\nalwaysApply: true\n---\n\nNo frontmatter here.\n',
    );
  });
});
