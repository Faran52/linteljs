import {
  commandPayload,
  copilotPayload,
  cursorShellPayload,
  cursorToolPayload,
  geminiPayload,
  runHook,
  spawnHook,
} from '@mocks/runHook';
import {
  describe,
  expect,
  it,
} from 'vitest';

const UNFIXED = /^eslint was called without --fix/u;

describe('eslintFixWarningHook.ts', () => {
  it('warns for eslint without --fix', () => {
    const reply = runHook('eslintFixWarningHook.ts', commandPayload('eslint src'));
    expect(reply).toMatch(UNFIXED);
  });

  it('clears eslint with --fix', () => {
    const reply = runHook('eslintFixWarningHook.ts', commandPayload('eslint src --fix'));
    expect(reply).toBeUndefined();
  });

  it('reads the PowerShell tool\'s command as PowerShell', () => {
    const payload = commandPayload('& .\\node_modules\\.bin\\eslint.cmd src', 'PowerShell');
    const reply = runHook('eslintFixWarningHook.ts', payload);
    expect(reply).toMatch(UNFIXED);
  });

  it('stays silent on malformed JSON', () => {
    const reply = runHook('eslintFixWarningHook.ts', '{');
    expect(reply).toBeUndefined();
  });

  it('stays silent when the payload carries no command', () => {
    const reply = runHook('eslintFixWarningHook.ts', { tool_input: {} });
    expect(reply).toBeUndefined();
  });

  describe('on Copilot, Cursor and Gemini CLI', () => {
    it.each(['bash', 'powershell'])('warns after Copilot runs eslint without --fix in %s', (tool) => {
      const reply = runHook('eslintFixWarningHook.ts', copilotPayload(tool, { command: 'npx eslint src' }));
      expect(reply).toMatch(UNFIXED);
    });

    it('clears a Copilot run with --fix', () => {
      const reply = runHook('eslintFixWarningHook.ts', copilotPayload('bash', { command: 'eslint src --fix' }));

      expect(reply)
        .toBeUndefined();
    });

    it('warns after Cursor runs eslint without --fix', () => {
      const reply = runHook('eslintFixWarningHook.ts', cursorToolPayload('pnpm exec eslint src', 'postToolUse'));

      expect(reply)
        .toMatch(UNFIXED);
    });

    it('warns after Gemini CLI runs eslint without --fix, and clears a run with it', () => {
      const unfixedRun = geminiPayload('AfterTool', 'run_shell_command', { command: 'npx eslint src' });
      const fixedRun = geminiPayload('AfterTool', 'run_shell_command', { command: 'eslint src --fix' });
      const unfixed = runHook('eslintFixWarningHook.ts', unfixedRun);
      const fixed = runHook('eslintFixWarningHook.ts', fixedRun);

      expect(unfixed).toMatch(UNFIXED);
      expect(fixed).toBeUndefined();
    });

    it.each([
      ['Claude Code\'s copy', cursorToolPayload('eslint src', 'preToolUse')],
      ['the shell gate', cursorShellPayload('eslint src')],
    ])('answers nothing to %s under Cursor', (_label, payload) => {
      const actual = spawnHook('eslintFixWarningHook.ts', payload);
      expect(actual).toBe('');
    });
  });
});
