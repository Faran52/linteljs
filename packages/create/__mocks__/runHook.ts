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

type Host = 'claude' | 'copilot' | 'cursor';

export type HookScript = 'bannedPatternGuardHook.ts' | 'eslintFixWarningHook.ts' | 'gitSafetyGuardHook.ts';

export const HOOKS_ROOT = join(TEMPLATES_ROOT, 'project/plugins/linteljs/hooks');

// Claude Code and Codex hand a shell hook the same payload, so one shape answers for both hosts.
export const commandPayload = (command: string, tool: 'Bash' | 'PowerShell' = 'Bash'): CommandHookPayload => {
  return {
    cwd: tmpdir(),
    hook_event_name: 'PreToolUse',
    tool_name: tool,
    tool_input: { command },
  };
};

// Copilot CLI's camelCase payload, with `toolArgs` as the JSON text the CLI sends.
export const copilotPayload = (toolName: string, toolArgs: object, cwd = tmpdir()): CopilotPayload => {
  return {
    cwd,
    timestamp: 1_704_614_400_000,
    toolName,
    toolArgs: JSON.stringify(toolArgs),
  };
};

// Cursor's shell gate carries the command at the top level; its generic tool events nest it as Claude Code does.
export const cursorShellPayload = (command: string): CursorShellPayload => {
  return {
    command,
    cursor_version: '2.4.0',
    cwd: tmpdir(),
    hook_event_name: 'beforeShellExecution',
  };
};

export const cursorToolPayload = (command: string, event: 'postToolUse' | 'preToolUse'): CursorToolPayload => {
  return {
    cursor_version: '2.4.0',
    cwd: tmpdir(),
    hook_event_name: event,
    tool_name: 'Shell',
    tool_input: { command },
  };
};

// Restated rather than imported from the hooks, so a hook that detects its host wrongly fails here.
const hostOf = (input: object | string): Host => {
  if (typeof input === 'string') {
    return 'claude';
  }
  if ('cursor_version' in input) {
    return 'cursor';
  }
  return 'toolName' in input ? 'copilot' : 'claude';
};

const CURSOR_ALLOW = '{"permission":"allow"}\n';

// The one decision each hook may print on each host, around the text it chose; anything else on stdout is a hook
// the host cannot parse.
const decisionOf = (name: HookScript, host: Host, text: string): object => {
  if (host === 'cursor') {
    return name === 'gitSafetyGuardHook.ts'
      ? {
          permission: 'deny',
          user_message: text,
          agent_message: text,
        }
      : { additional_context: text };
  }
  if (host === 'copilot') {
    return name === 'gitSafetyGuardHook.ts'
      ? {
          permissionDecision: 'deny',
          permissionDecisionReason: text,
        }
      : { additionalContext: text };
  }
  if (name === 'bannedPatternGuardHook.ts') {
    return {
      decision: 'block',
      reason: text,
    };
  }
  return {
    hookSpecificOutput: name === 'gitSafetyGuardHook.ts'
      ? {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: text,
        }
      : {
          hookEventName: 'PreToolUse',
          additionalContext: text,
        },
  };
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

// Holds stdout to nothing or exactly one decision object on one line, and answers the text the decision carries.
// Cursor's shell gate prints an explicit allow for a clear command, which carries no text.
export const expectDecisionOutput = (name: HookScript, stdout: string, host: Host = 'claude'): string | undefined => {
  if (stdout === '' || (host === 'cursor' && name === 'gitSafetyGuardHook.ts' && stdout === CURSOR_ALLOW)) {
    return undefined;
  }
  const text = textOf(stdout);

  expect(stdout).toBe(`${JSON.stringify(decisionOf(name, host, text))}\n`);

  return text;
};

/**
 * Runs the real hook through plain `node`, as every host's hooks file does, and answers its raw stdout. `projectDir`
 * is the host's own answer for the project root, dropped unless a case sets one: this suite runs under a harness that
 * exports it, which would point the checker search at this workspace.
 */
export const spawnHook = (name: HookScript, input: object | string, projectDir?: string): string => {
  const env: typeof process.env = { ...process.env };

  delete env['CLAUDE_PROJECT_DIR'];

  if (projectDir !== undefined) {
    env['CLAUDE_PROJECT_DIR'] = projectDir;
  }

  const result = spawnSync(process.execPath, [join(HOOKS_ROOT, name)], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env,
    // A parser that loops would otherwise hang the suite: a synchronous spawn ignores the test timeout.
    timeout: 10_000,
  });

  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');

  return result.stdout;
};

// The text of the hook's decision, or `undefined` for none, with stdout held to the one shape its host reads.
export const runHook = (name: HookScript, input: object | string, projectDir?: string): string | undefined => {
  return expectDecisionOutput(name, spawnHook(name, input, projectDir), hostOf(input));
};
