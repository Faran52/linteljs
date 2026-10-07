import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'vitest';

import { TEMPLATES_ROOT } from '@disk';

interface ToolInput {
  command: string;
}

interface CommandHookPayload {
  cwd: string;
  hook_event_name: 'PreToolUse';
  tool_name: 'Bash' | 'PowerShell';
  tool_input: ToolInput;
}

interface CopilotPayload {
  cwd: string;
  timestamp: number;
  toolName: string;
  toolArgs: string;
}

interface CursorShellPayload {
  command: string;
  cursor_version: string;
  cwd: string;
  hook_event_name: 'beforeShellExecution';
}

interface CursorToolPayload {
  cursor_version: string;
  cwd: string;
  hook_event_name: 'postToolUse' | 'preToolUse';
  tool_name: 'Shell';
  tool_input: ToolInput;
}

interface GeminiPayload {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: GeminiEvent;
  timestamp: string;
  tool_name: string;
  tool_input: object;
}

type GeminiEvent = 'AfterTool' | 'BeforeTool';

type Host = 'claude' | 'copilot' | 'cursor' | 'gemini';

export type HookScript = 'bannedPatternGuardHook.ts' | 'commitGateHook.ts' | 'eslintFixWarningHook.ts'
  | 'generatedFileGuardHook.ts' | 'gitSafetyGuardHook.ts';

// Scripts that answer in their own shape rather than a decision, so only `spawnHook` runs them.
export type ContextScript = 'checkRecordHook.ts' | 'checkStatusHook.ts' | 'contextWarningHook.ts'
  | 'mainStatusLineHook.ts' | 'subagentStatusLineHook.ts';

// The hooks that deny; the rest add context or block.
const PERMISSIONS = new Map<HookScript, 'deny'>([
  ['commitGateHook.ts', 'deny'],
  ['generatedFileGuardHook.ts', 'deny'],
  ['gitSafetyGuardHook.ts', 'deny'],
]);

const HOOKS_ROOT = join(TEMPLATES_ROOT, 'project/plugins/linteljs/hooks');

export const commandPayload = (command: string, tool: 'Bash' | 'PowerShell' = 'Bash'): CommandHookPayload => {
  const payload: CommandHookPayload = {
    cwd: tmpdir(),
    hook_event_name: 'PreToolUse',
    tool_name: tool,
    tool_input: { command },
  };

  return payload;
};

export const copilotPayload = (toolName: string, toolArgs: object, cwd = tmpdir()): CopilotPayload => {
  const payload: CopilotPayload = {
    cwd,
    timestamp: 1_704_614_400_000,
    toolName,
    toolArgs: JSON.stringify(toolArgs),
  };

  return payload;
};

export const cursorShellPayload = (command: string): CursorShellPayload => {
  const payload: CursorShellPayload = {
    command,
    cursor_version: '2.4.0',
    cwd: tmpdir(),
    hook_event_name: 'beforeShellExecution',
  };

  return payload;
};

export const cursorToolPayload = (command: string, event: 'postToolUse' | 'preToolUse'): CursorToolPayload => {
  const payload: CursorToolPayload = {
    cursor_version: '2.4.0',
    cwd: tmpdir(),
    hook_event_name: event,
    tool_name: 'Shell',
    tool_input: { command },
  };

  return payload;
};

// The base fields every Gemini CLI hook gets, and a tool event's own two.
export const geminiPayload = (
  event: GeminiEvent,
  tool: string,
  toolInput: object,
  cwd = tmpdir(),
): GeminiPayload => {
  const payload: GeminiPayload = {
    session_id: 'e1d9603e',
    transcript_path: '/p/e1d9603e.json',
    cwd,
    hook_event_name: event,
    timestamp: '2026-10-07T12:00:00.000Z',
    tool_name: tool,
    tool_input: toolInput,
  };

  return payload;
};

// Restated rather than imported, so a hook that detects its host wrongly fails here.
const hostOf = (input: object | string): Host => {
  if (typeof input === 'string') {
    return 'claude';
  }

  if ('cursor_version' in input) {
    return 'cursor';
  }

  if ('hook_event_name' in input && (input.hook_event_name === 'BeforeTool' || input.hook_event_name === 'AfterTool')) {
    return 'gemini';
  }

  return 'toolName' in input ? 'copilot' : 'claude';
};

const CURSOR_ALLOW = '{"permission":"allow"}\n';

const decisionOf = (name: HookScript, host: Host, text: string): object => {
  const permission = PERMISSIONS.get(name);

  if (host === 'cursor') {
    const decision = permission !== undefined
      ? {
          permission,
          user_message: text,
          agent_message: text,
        }
      : { additional_context: text };

    return decision;
  }

  if (host === 'copilot') {
    const decision = permission !== undefined
      ? {
          permissionDecision: permission,
          permissionDecisionReason: text,
        }
      : { additionalContext: text };

    return decision;
  }

  if (host === 'gemini') {
    const decision = permission !== undefined
      ? {
          decision: permission,
          reason: text,
        }
      : {
          hookSpecificOutput: {
            hookEventName: 'AfterTool',
            additionalContext: text,
          },
        };

    return decision;
  }

  if (name === 'bannedPatternGuardHook.ts') {
    const block = {
      decision: 'block',
      reason: text,
    };

    return block;
  }

  const decision = {
    hookSpecificOutput: permission !== undefined
      ? {
          hookEventName: 'PreToolUse',
          permissionDecision: permission,
          permissionDecisionReason: text,
        }
      : {
          hookEventName: 'PreToolUse',
          additionalContext: text,
        },
  };

  return decision;
};

const textOf = (stdout: string): string => {
  const match
    = /"(?:permissionDecisionReason|additionalContext|additional_context|agent_message|reason)":("(?:\\.|[^"\\])*")/u
      .exec(stdout);
  const encoded = match?.[1];

  if (encoded === undefined) {
    return '';
  }

  const text: unknown = JSON.parse(encoded);
  return typeof text === 'string' ? text : '';
};

export const expectDecisionOutput = (name: HookScript, stdout: string, host: Host = 'claude'): string | undefined => {
  if (stdout === '' || (host === 'cursor' && name === 'gitSafetyGuardHook.ts' && stdout === CURSOR_ALLOW)) {
    return undefined;
  }

  const text = textOf(stdout);

  const decision = decisionOf(name, host, text);

  expect(stdout).toBe(`${JSON.stringify(decision)}\n`);

  return text;
};

// `projectDir` is dropped unless set: the harness exports one, which would point the checker at this workspace.
// `pluginData` alike: a plugin-run harness exports `CLAUDE_PLUGIN_DATA`, where the context hook keeps its marker.
export const spawnHook = (
  name: ContextScript | HookScript,
  input: object | string,
  projectDir?: string,
  pluginData?: string,
  cwd?: string,
): string => {
  const env: typeof process.env = { ...process.env };

  delete env['CLAUDE_PROJECT_DIR'];
  delete env['CLAUDE_PLUGIN_DATA'];

  if (projectDir !== undefined) {
    env['CLAUDE_PROJECT_DIR'] = projectDir;
  }

  if (pluginData !== undefined) {
    env['CLAUDE_PLUGIN_DATA'] = pluginData;
  }

  const result = spawnSync(process.execPath, [join(HOOKS_ROOT, name)], {
    cwd,
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env,
    // A synchronous spawn ignores the test timeout.
    timeout: 10_000,
  });

  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');

  return result.stdout;
};

export const runHook = (name: HookScript, input: object | string, projectDir?: string): string | undefined => {
  const stdout = spawnHook(name, input, projectDir);
  const host = hostOf(input);

  return expectDecisionOutput(name, stdout, host);
};
