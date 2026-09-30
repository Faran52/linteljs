import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import {
  copilotPayload,
  cursorShellPayload,
  cursorToolPayload,
} from '@mocks/runHook';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  decisionOf,
  hostOf,
  readCommand,
  readEdit,
  readSession,
  writeDecision,
} from './hostUtils.ts';

describe('hostOf', () => {
  it.each([
    ['claude', {
      tool_name: 'Bash',
      tool_input: { command: 'ls' },
    }],
    ['copilot', copilotPayload('bash', { command: 'ls' })],
    ['cursor', cursorShellPayload('ls')],
    ['cursor', cursorToolPayload('ls', 'postToolUse')],
  ])('reads %s from the payload shape', (host, payload) => {
    expect(hostOf(payload)).toBe(host);
  });
});

describe('readCommand', () => {
  it.each([
    ['Bash', 'bash'],
    ['PowerShell', 'powershell'],
  ])('reads a Claude Code or Codex %s command in its own dialect', (tool, dialect) => {
    expect(readCommand({
      tool_name: tool,
      tool_input: { command: 'git status' },
    }, 'beforeShellExecution')).toEqual({
      host: 'claude',
      command: 'git status',
      dialect,
    });
  });

  it.each([
    ['bash', 'bash'],
    ['powershell', 'powershell'],
  ])('reads Copilot %s arguments sent as JSON text', (tool, dialect) => {
    expect(readCommand(copilotPayload(tool, { command: 'git status' }), 'postToolUse')).toEqual({
      host: 'copilot',
      command: 'git status',
      dialect,
    });
  });

  it('reads Copilot arguments sent as an object, as its SDK does', () => {
    expect(readCommand({
      toolName: 'bash',
      toolArgs: { command: 'git status' },
    }, 'postToolUse')?.command).toBe('git status');
  });

  it.each([
    ['text that is not JSON', 'git status'],
    ['JSON that is no object', '42'],
  ])('reads nothing from Copilot arguments that are %s', (_label, toolArgs) => {
    expect(readCommand({
      toolName: 'bash',
      toolArgs,
    }, 'postToolUse')).toBeUndefined();
  });

  it.each([
    ['darwin', 'bash'],
    ['win32', 'powershell'],
  ] as const)('reads Cursor\'s shell gate command on %s as %s', (platform, dialect) => {
    expect(readCommand(cursorShellPayload('git status'), 'beforeShellExecution', platform)).toEqual({
      host: 'cursor',
      command: 'git status',
      dialect,
    });
  });

  it('reads Cursor\'s tool events from the nested input', () => {
    expect(readCommand(cursorToolPayload('eslint src', 'postToolUse'), 'postToolUse', 'linux')?.command)
      .toBe('eslint src');
  });

  it.each([
    [cursorToolPayload('git stash', 'preToolUse'), 'beforeShellExecution'],
    [cursorToolPayload('eslint src', 'preToolUse'), 'postToolUse'],
    [cursorShellPayload('eslint src'), 'postToolUse'],
  ] as const)('ignores a Cursor payload for any event but the one the hook answers', (payload, event) => {
    expect(readCommand(payload, event)).toBeUndefined();
  });

  it('reads nothing where there is no command', () => {
    expect(readCommand({ tool_input: {} }, 'beforeShellExecution')).toBeUndefined();
    expect(readCommand({ tool_input: { command: 7 } }, 'beforeShellExecution')).toBeUndefined();
  });
});

describe('readSession', () => {
  const main = {
    session_id: 'e1d9603e-6671_4aba',
    transcript_path: '/p/e1d9603e.jsonl',
    tool_name: 'Bash',
  };

  it('reads the main session\'s id and transcript', () => {
    expect(readSession(main)).toEqual({
      session: 'e1d9603e-6671_4aba',
      transcript: '/p/e1d9603e.jsonl',
    });
  });

  it.each([
    ['a subagent\'s call', { ...main, agent_id: 'a1' }],
    ['a Cursor payload', { ...main, cursor_version: '2.4.0' }],
    ['a Copilot payload', { ...main, toolName: 'bash' }],
    ['no transcript', { session_id: 'abc' }],
    ['no session', { transcript_path: '/p/t.jsonl' }],
    ['a session that is not a plain token', { ...main, session_id: '../x' }],
    ['an empty session', { ...main, session_id: '' }],
  ])('reads nothing from %s', (_label, payload) => {
    expect(readSession(payload)).toBeUndefined();
  });
});

describe('readEdit', () => {
  it('reads Claude Code\'s file, its response path and the cwd', () => {
    expect(readEdit({
      cwd: '/repo',
      tool_input: { file_path: 'src/a.ts' },
      tool_response: { filePath: 'src/b.ts' },
    })).toEqual({
      host: 'claude',
      cwd: '/repo',
      paths: ['src/a.ts', 'src/b.ts'],
    });
  });

  it('reads Copilot\'s path from its JSON text arguments', () => {
    expect(readEdit(copilotPayload('edit', { path: 'src/a.ts' }, '/repo'))).toEqual({
      host: 'copilot',
      cwd: '/repo',
      paths: ['src/a.ts'],
    });
  });

  it.each([
    ['command', { command: '*** Begin Patch\n*** Update File: src/a.ts\n*** Add File: src/b.ts\n*** End Patch' }],
    ['patch', { patch: '*** Add File: src/a.ts\r\n*** Update File: src/b.ts' }],
  ])('reads every Add and Update header of apply_patch text under %s', (_key, input) => {
    expect(readEdit({ tool_input: input })?.paths).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('reads raw apply_patch text, and an empty cwd where none was sent', () => {
    expect(readEdit({ tool_input: '*** Update File: src/a.ts' })).toEqual({
      host: 'claude',
      cwd: '',
      paths: ['src/a.ts'],
    });
  });

  it('reads nothing from Cursor', () => {
    expect(readEdit({
      cursor_version: '2.4.0',
      hook_event_name: 'postToolUse',
      tool_name: 'Write',
      tool_input: { file_path: 'src/a.ts' },
    })).toBeUndefined();
  });
});

describe('decisionOf', () => {
  it.each([
    [
      'claude',
      'deny',
      {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: 'why',
        },
      },
    ],
    [
      'claude',
      'warn',
      {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: 'why',
        },
      },
    ],
    [
      'claude',
      'block',
      {
        decision: 'block',
        reason: 'why',
      },
    ],
    [
      'copilot',
      'deny',
      {
        permissionDecision: 'deny',
        permissionDecisionReason: 'why',
      },
    ],
    [
      'copilot',
      'warn',
      { additionalContext: 'why' },
    ],
    [
      'copilot',
      'block',
      { additionalContext: 'why' },
    ],
    [
      'cursor',
      'deny',
      {
        permission: 'deny',
        user_message: 'why',
        agent_message: 'why',
      },
    ],
    [
      'cursor',
      'warn',
      { additional_context: 'why' },
    ],
  ] as const)('writes a %s %s in that host\'s own words', (host, kind, decision) => {
    expect(decisionOf(host, kind, 'why')).toEqual(decision);
  });

  it('allows a clear command explicitly at Cursor\'s shell gate and nowhere else', () => {
    expect(decisionOf('cursor', 'deny', undefined)).toEqual({ permission: 'allow' });
    expect(decisionOf('cursor', 'warn', undefined)).toBeUndefined();
    expect(decisionOf('claude', 'deny', undefined)).toBeUndefined();
    expect(decisionOf('copilot', 'deny', undefined)).toBeUndefined();
  });
});

describe('writeDecision', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the decision as one line, and nothing when there is none', () => {
    const write = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    writeDecision('copilot', 'warn', undefined);
    writeDecision('copilot', 'warn', 'why');

    expect(write.mock.calls).toEqual([['{"additionalContext":"why"}\n']]);
  });
});

describe('readPayload', () => {
  it('reads a payload larger than one pipe buffer', () => {
    const command = `git status ${'x'.repeat(4 * 1024 * 1024)}; git stash`;
    const result = spawnSync(process.execPath, [join(import.meta.dirname, '..', 'gitSafetyGuardHook.ts')], {
      input: JSON.stringify({ tool_input: { command } }),
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout: 30_000,
    });

    expect(result.stdout).toContain('"permissionDecision":"deny"');
  });

  it.each([
    '{',
    'null',
    '"text"',
  ])('reads %s as no payload', (input) => {
    const result = spawnSync(process.execPath, [join(import.meta.dirname, '..', 'gitSafetyGuardHook.ts')], {
      input,
      encoding: 'utf8',
      timeout: 30_000,
    });

    expect(result.stdout).toBe('');
  });
});
