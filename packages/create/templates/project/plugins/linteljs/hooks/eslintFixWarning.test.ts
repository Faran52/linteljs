import {
  describe,
  expect,
  it,
} from 'vitest';

import { bashPayload, runHook } from '#mocks/runHook';

const ESLINT_WARNING = {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    additionalContext: 'eslint was called without --fix. Run eslint <files> --fix instead.',
  },
};

// One command per parser decision: which command earns which decision is `commandParser.test.ts`'s to say.
describe('eslint-fix-warning.sh', () => {
  it.each([
    ['eslint without --fix', 'eslint src'],
    ['a command the parser cannot read', 'env -P'],
  ])('warns for %s', (_label, command) => {
    expect(JSON.parse(runHook('eslint-fix-warning.sh', bashPayload(command)))).toEqual(ESLINT_WARNING);
  });

  it('does not warn for a cleared command', () => {
    expect(runHook('eslint-fix-warning.sh', bashPayload('eslint src --fix'))).toBe('');
  });

  it('ignores malformed JSON', () => {
    expect(runHook('eslint-fix-warning.sh', '{')).toBe('');
  });
});
