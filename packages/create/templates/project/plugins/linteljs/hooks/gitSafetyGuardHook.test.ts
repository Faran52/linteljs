import {
  commandPayload,
  copilotPayload,
  cursorShellPayload,
  cursorToolPayload,
  runHook,
  spawnHook,
} from '@mocks/runHook';
import {
  describe,
  expect,
  it,
} from 'vitest';

const BLOCKED = /^Blocked `/u;

describe('gitSafetyGuardHook.ts', () => {
  it('denies a banned git operation', () => {
    const reply = runHook('gitSafetyGuardHook.ts', commandPayload('git stash'));
    expect(reply).toMatch(BLOCKED);
  });

  it('clears a command with nothing to deny', () => {
    const reply = runHook('gitSafetyGuardHook.ts', commandPayload('git status'));
    expect(reply).toBeUndefined();
  });

  it('reads the PowerShell tool\'s command as PowerShell', () => {
    const reply = runHook('gitSafetyGuardHook.ts', commandPayload('git add `\n.', 'PowerShell'));
    expect(reply).toMatch(BLOCKED);
  });

  it('stays silent on malformed JSON', () => {
    const reply = runHook('gitSafetyGuardHook.ts', '{');
    expect(reply).toBeUndefined();
  });

  it('stays silent when the payload carries no command', () => {
    const reply = runHook('gitSafetyGuardHook.ts', { tool_input: {} });
    expect(reply).toBeUndefined();
  });

  describe('on Copilot and Cursor', () => {
    it.each(['bash', 'powershell'])('denies a banned git operation Copilot runs in %s', (tool) => {
      const reply = runHook('gitSafetyGuardHook.ts', copilotPayload(tool, { command: 'git stash' }));
      expect(reply).toMatch(BLOCKED);
    });

    it('reads a Copilot powershell command as PowerShell', () => {
      const reply = runHook('gitSafetyGuardHook.ts', copilotPayload('powershell', { command: 'git add `\n.' }));

      expect(reply)
        .toMatch(BLOCKED);
    });

    it('clears a Copilot command with nothing to deny', () => {
      const reply = runHook('gitSafetyGuardHook.ts', copilotPayload('bash', { command: 'git status' }));
      expect(reply).toBeUndefined();
    });

    it('denies at Cursor\'s shell gate, and allows a clear command there explicitly', () => {
      const reply = runHook('gitSafetyGuardHook.ts', cursorShellPayload('git commit --amend'));
      expect(reply).toMatch(BLOCKED);
      const actual = spawnHook('gitSafetyGuardHook.ts', cursorShellPayload('git status'));
      expect(actual).toBe('{"permission":"allow"}\n');
    });

    it('answers nothing to the copy Cursor runs from Claude Code\'s hooks', () => {
      const actual = spawnHook('gitSafetyGuardHook.ts', cursorToolPayload('git stash', 'preToolUse'));
      expect(actual).toBe('');
    });
  });
});
