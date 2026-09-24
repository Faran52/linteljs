import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  commandPayload,
  copilotPayload,
  cursorShellPayload,
  cursorToolPayload,
  expectDecisionOutput,
  type HookScript,
  runHook,
} from '@mocks/runHook';
import {
  describe,
  expect,
  it,
} from 'vitest';

// One file for both hosts: Claude Code and Codex each substitute `${CLAUDE_PLUGIN_ROOT}` before a shell sees it,
// and Codex ignores an exec-form `args`, so the path sits inside `command`.
it('registers the three hooks, each run by node from the plugin root', () => {
  expect(JSON.parse(readFileSync(join(import.meta.dirname, 'hooks.json'), 'utf8'))).toEqual({
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash|PowerShell',
          hooks: [
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/gitSafetyGuardHook.ts"',
            },
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/eslintFixWarningHook.ts"',
            },
          ],
        },
      ],
      PostToolUse: [
        {
          matcher: 'Edit|Write|apply_patch',
          hooks: [
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/bannedPatternGuardHook.ts"',
            },
          ],
        },
      ],
    },
  });
});

// Both hosts find `hooks/hooks.json` by convention, and a manifest `hooks` field would replace that under Codex.
it.each(['.claude-plugin/plugin.json', '.codex-plugin/plugin.json'])('leaves %s to discover hooks.json', (manifest) => {
  expect(readFileSync(join(import.meta.dirname, '..', manifest), 'utf8')).not.toContain('"hooks"');
});

const CASES: [HookScript, object | string][] = [
  ['gitSafetyGuardHook.ts', commandPayload('git status')],
  ['gitSafetyGuardHook.ts', commandPayload('git add -A && git commit --amend')],
  ['gitSafetyGuardHook.ts', commandPayload('echo "unterminated')],
  ['gitSafetyGuardHook.ts', commandPayload('git add `\n.', 'PowerShell')],
  ['gitSafetyGuardHook.ts', '{'],
  ['eslintFixWarningHook.ts', commandPayload('eslint src')],
  ['eslintFixWarningHook.ts', commandPayload('eslint src --fix')],
  ['eslintFixWarningHook.ts', commandPayload('env -P')],
  ['eslintFixWarningHook.ts', ''],
  ['bannedPatternGuardHook.ts', { tool_input: { file_path: 'missing.ts' } }],
  ['bannedPatternGuardHook.ts', { tool_input: [] }],
  ['bannedPatternGuardHook.ts', 'null'],
  ['gitSafetyGuardHook.ts', copilotPayload('bash', { command: 'git stash' })],
  ['gitSafetyGuardHook.ts', copilotPayload('powershell', { command: 'git status' })],
  ['gitSafetyGuardHook.ts', cursorShellPayload('git reset --hard')],
  ['gitSafetyGuardHook.ts', cursorShellPayload('git status')],
  ['gitSafetyGuardHook.ts', cursorToolPayload('git stash', 'preToolUse')],
  ['eslintFixWarningHook.ts', copilotPayload('bash', { command: 'eslint src' })],
  ['eslintFixWarningHook.ts', cursorToolPayload('eslint src', 'postToolUse')],
  ['eslintFixWarningHook.ts', cursorToolPayload('eslint src', 'preToolUse')],
  ['bannedPatternGuardHook.ts', copilotPayload('edit', { path: 'missing.ts' })],
];

/**
 * A host parses stdout as the decision, so a stray line of text turns a deny into nothing at all. `runHook` holds
 * every case in every suite to this, in the shape of the host that sent the payload; these are the edges, and the
 * check itself is shown to refuse the rest.
 */
describe('hook stdout', () => {
  it.each(CASES)('%s prints nothing or exactly one decision', (name, input) => {
    expect(() => {
      return runHook(name, input);
    }).not.toThrow();
  });

  it.each([
    ['text before the decision', 'blocked\n{"decision":"block","reason":"x"}\n'],
    ['two decisions', '{"decision":"block","reason":"x"}\n{"decision":"block","reason":"x"}\n'],
    ['a decision of another hook', '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"x"}}\n'],
    ['plain text', 'Banned pattern.\n'],
  ])('refuses %s', (_label, stdout) => {
    expect(() => {
      return expectDecisionOutput('bannedPatternGuardHook.ts', stdout);
    }).toThrow();
  });

  // Each host reads only its own shape, so another host's decision is as unreadable to it as plain text.
  it.each([
    ['Claude Code\'s deny under Copilot', 'copilot', '{"hookSpecificOutput":{"hookEventName":"PreToolUse",'
    + '"permissionDecision":"deny","permissionDecisionReason":"x"}}\n'],
    ['Copilot\'s deny under Cursor', 'cursor', '{"permissionDecision":"deny","permissionDecisionReason":"x"}\n'],
    ['Cursor\'s allow under Claude Code', 'claude', '{"permission":"allow"}\n'],
  ] as const)('refuses %s', (_label, host, stdout) => {
    expect(() => {
      return expectDecisionOutput('gitSafetyGuardHook.ts', stdout, host);
    }).toThrow();
  });
});
