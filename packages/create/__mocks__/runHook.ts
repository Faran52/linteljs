import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'vitest';

import { TEMPLATES_ROOT } from '#disk';

interface ToolInput {
  command: string;
}

interface BashHookPayload {
  cwd: string;
  hook_event_name: 'PreToolUse';
  tool_name: 'Bash';
  tool_input: ToolInput;
}

type HookScript = 'banned-pattern-guard.sh' | 'eslint-fix-warning.sh' | 'git-safety-guard.sh';

export const PLUGIN_ROOT = join(TEMPLATES_ROOT, 'project/plugins/linteljs');

// Claude Code and Codex hand a Bash hook the same payload, so one shape answers for both hosts.
export const bashPayload = (command: string): BashHookPayload => {
  return {
    cwd: tmpdir(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command },
  };
};

/**
 * `projectDir` is the host's own answer for where the project root is, and it is dropped unless a case sets one: this
 * suite runs under a harness that exports it, and inheriting it would point every hook at this workspace rather than
 * at the fixture, which resolves because this workspace has a checker of its own.
 */
export const runHook = (name: HookScript, input: object | string, projectDir?: string): string => {
  const env: typeof process.env = {
    ...process.env,
    CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
  };

  delete env['CLAUDE_PROJECT_DIR'];

  if (projectDir !== undefined) {
    env['CLAUDE_PROJECT_DIR'] = projectDir;
  }

  const result = spawnSync('/bin/bash', [join(PLUGIN_ROOT, 'hooks', name)], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env,
  });

  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');

  return result.stdout.trim();
};
