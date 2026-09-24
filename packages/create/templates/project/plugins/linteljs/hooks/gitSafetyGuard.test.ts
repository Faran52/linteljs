import {
  describe,
  expect,
  it,
} from 'vitest';

import { bashPayload, runHook } from '#mocks/runHook';

const GIT_DENIAL = {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: 'Banned git operation. Stage only explicit paths and never '
      + 'bypass hooks or rewrite the current commit.',
  },
};

// One command per parser decision: which command earns which decision is `commandParser.test.ts`'s to say.
describe('git-safety-guard.sh', () => {
  it.each([
    ['a banned operation', 'git stash'],
    ['a command the parser cannot read', 'echo "unterminated'],
  ])('denies %s', (_label, command) => {
    expect(JSON.parse(runHook('git-safety-guard.sh', bashPayload(command)))).toEqual(GIT_DENIAL);
  });

  it('allows a cleared command', () => {
    expect(runHook('git-safety-guard.sh', bashPayload('git status'))).toBe('');
  });

  it('ignores malformed JSON', () => {
    expect(runHook('git-safety-guard.sh', '{')).toBe('');
  });

  it('keeps missing Bash command host data as a silent allow', () => {
    expect(runHook('git-safety-guard.sh', { tool_input: {} })).toBe('');
  });
});
