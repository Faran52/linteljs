import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'vitest';

import { TEMPLATES_ROOT } from '#disk';

interface ToolInput {
  command: string;
}

interface CommandHookPayload {
  cwd: string;
  hook_event_name: 'PreToolUse';
  tool_name: 'Bash' | 'PowerShell';
  tool_input: ToolInput;
}

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

// The one decision each hook may print, around the text it chose; anything else on stdout is a hook the host
// cannot parse.
const decisionOf = (name: HookScript, text: string): object => {
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
  const match = /"(?:permissionDecisionReason|additionalContext|reason)":("(?:\\.|[^"\\])*")/u.exec(stdout);
  const encoded = match?.[1];
  if (encoded === undefined) {
    return '';
  }
  const text: unknown = JSON.parse(encoded);
  return typeof text === 'string' ? text : '';
};

// Holds stdout to nothing or exactly one decision object on one line, and answers the text the decision carries.
export const expectDecisionOutput = (name: HookScript, stdout: string): string | undefined => {
  if (stdout === '') {
    return undefined;
  }
  const text = textOf(stdout);

  expect(stdout).toBe(`${JSON.stringify(decisionOf(name, text))}\n`);

  return text;
};

/**
 * Runs the real hook through plain `node`, as `hooks.json` does, and answers the text of its decision or `undefined`
 * for none. `projectDir` is the host's own answer for the project root, dropped unless a case sets one: this suite
 * runs under a harness that exports it, which would point the checker search at this workspace.
 */
export const runHook = (name: HookScript, input: object | string, projectDir?: string): string | undefined => {
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

  return expectDecisionOutput(name, result.stdout);
};
