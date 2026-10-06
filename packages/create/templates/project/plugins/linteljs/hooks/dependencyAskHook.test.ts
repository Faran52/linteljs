import {
  commandPayload,
  copilotPayload,
  cursorShellPayload,
  cursorToolPayload,
  runHook,
} from '@mocks/runHook';
import {
  describe,
  expect,
  it,
} from 'vitest';

const ASKED = 'This adds or removes dependencies: zod. Approve it only if that change was asked for.';

describe('dependencyAskHook.ts', () => {
  it('asks before a command that adds a dependency, and clears one that does not', () => {
    const added = runHook('dependencyAskHook.ts', commandPayload('pnpm add zod'));
    const installed = runHook('dependencyAskHook.ts', commandPayload('pnpm install'));

    expect(added).toBe(ASKED);
    expect(installed).toBeUndefined();
  });

  it('asks before an edit that adds a dependency to a new manifest', () => {
    const reply = runHook('dependencyAskHook.ts', {
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: {
        file_path: '/nonexistent/linteljs/package.json',
        content: '{"dependencies":{"zod":"4"}}',
      },
    });

    expect(reply).toBe('This adds or removes dependencies: zod (dependencies). Approve it only if that change was '
      + 'asked for.');
  });

  it('asks under Copilot and at Cursor\'s shell gate, and stays silent on Cursor\'s copy', () => {
    const copilot = runHook('dependencyAskHook.ts', copilotPayload('bash', { command: 'pnpm add zod' }));
    const cursor = runHook('dependencyAskHook.ts', cursorShellPayload('pnpm add zod'));
    const copy = runHook('dependencyAskHook.ts', cursorToolPayload('pnpm add zod', 'preToolUse'));

    expect([
      copilot,
      cursor,
      copy,
    ]).toEqual([
      ASKED,
      ASKED,
      undefined,
    ]);
  });

  it('stays silent on malformed JSON', () => {
    const reply = runHook('dependencyAskHook.ts', '{');
    expect(reply).toBeUndefined();
  });
});
