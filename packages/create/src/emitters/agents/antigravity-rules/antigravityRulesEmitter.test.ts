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

import { antigravityRulesEmitter } from './antigravityRulesEmitter';

describe('antigravityRulesEmitter', () => {
  it('writes the Antigravity rules only where Antigravity was chosen', () => {
    const others = antigravityRulesEmitter(answersFor([
      'claude-code',
      'codex',
      'gemini-cli',
    ]));
    expect(others).toEqual([]);

    const artifacts = antigravityRulesEmitter(answersFor(['antigravity']));
    const written = targets(artifacts);

    expect(written).toContain('.agents/rules/repo-structure.md');
    expect(written).not.toContain('AGENTS.md');
  });

  it('rewrites the shared paths list as a glob trigger', () => {
    const artifacts = antigravityRulesEmitter(answersFor(['antigravity']));
    const transform = transformOf(artifacts, '.agents/rules/repo-structure.md');
    const output = transform(RULE, null);

    expect(output).toBe(
      '---\ntrigger: glob\nglobs: src/**/*.ts,src/**/*.tsx,tsconfig.json\n---\n\n'
      + '# Repository Structure\n\nBody.\n',
    );
  });

  it('scopes globs to every package of a monorepo', () => {
    const answers = {
      ...answersFor(['antigravity']),
      layout: 'monorepo' as const,
    };
    const artifacts = antigravityRulesEmitter(answers);
    const transform = transformOf(artifacts, '.agents/rules/repo-structure.md');
    const output = transform(RULE, null);

    expect(output).toContain('globs: **/src/**/*.ts,**/src/**/*.tsx,**/tsconfig.json\n');
  });

  it('keeps a rule with no paths list on, since Antigravity drops one without a trigger', () => {
    const artifacts = antigravityRulesEmitter(answersFor(['antigravity']));
    const transform = transformOf(artifacts, '.agents/rules/type-standards.md');
    const output = transform(UNSCOPED, null);

    expect(output).toBe('---\ntrigger: always_on\n---\n\nNo frontmatter here.\n');
  });
});
