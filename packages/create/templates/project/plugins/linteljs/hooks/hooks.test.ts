import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { env } from 'node:process';

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

it('registers the eight hooks, each run by node from the plugin root', () => {
  const hooksText = readFileSync(join(import.meta.dirname, 'hooks.json'), 'utf8');
  const hooks: unknown = JSON.parse(hooksText);

  expect(hooks).toEqual({
    modules: ['./checkBand.tsx'],
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
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/commitGateHook.ts"',
            },
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/dependencyAskHook.ts"',
            },
          ],
        },
        {
          matcher: 'Edit|Write|apply_patch',
          hooks: [
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/generatedFileGuardHook.ts"',
            },
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/dependencyAskHook.ts"',
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
        {
          matcher: 'Bash|PowerShell',
          hooks: [
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/checkRecordHook.ts"',
            },
          ],
        },
        {
          hooks: [
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/contextWarningHook.ts"',
            },
          ],
        },
      ],
      PostToolUseFailure: [
        {
          matcher: 'Bash|PowerShell',
          hooks: [
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/checkRecordHook.ts"',
            },
          ],
        },
      ],
    },
  });
});

it('leaves .claude-plugin/plugin.json to discover hooks.json', () => {
  const file = readFileSync(join(import.meta.dirname, '..', '.claude-plugin/plugin.json'), 'utf8');
  expect(file).not.toContain('"hooks"');
});

// Codex refuses the `modules` key, so it reads the copy the emitter writes without it.
it('points .codex-plugin/plugin.json at codexHooks.json', () => {
  const file = readFileSync(join(import.meta.dirname, '..', '.codex-plugin/plugin.json'), 'utf8');
  expect(file).toContain('"hooks": "./hooks/codexHooks.json"');
});

// The repo's own mod carries the band and its suite as copies, since the engine loads nothing outside a plugin.
it.each(['checkBand.tsx', 'checkBand.test.tsx'])('keeps .claude/skills/linteljs/hooks/%s byte-equal', (name) => {
  const shipped = readFileSync(join(import.meta.dirname, name));
  const copy = readFileSync(join(import.meta.dirname, '../../../../../../../.claude/skills/linteljs/hooks', name));

  const isEqual = copy.equals(shipped);

  expect(isEqual).toBe(true);
});

// `pnpm mod-types` has the engine write both beside the band; neither belongs in the tarball.
it('packs neither the engine-written mod types nor the tsconfig that reads them', () => {
  const typesDir = join(import.meta.dirname, '..', '.claude-plugin/types');
  const probe = join(typesDir, 'packProbe.d.ts');
  const hadTypes = existsSync(typesDir);
  mkdirSync(typesDir, { recursive: true });
  writeFileSync(probe, '');

  // The pnpm running this suite, so the file list is the one a publish packs.
  const packed = execFileSync(String(env['npm_execpath']), [
    'pack',
    '--dry-run',
    '--ignore-scripts',
    '--json',
  ], {
    cwd: join(import.meta.dirname, '../../../../..'),
    encoding: 'utf8',
  });

  rmSync(hadTypes ? probe : typesDir, {
    recursive: true,
    force: true,
  });

  expect(packed).toContain('templates/project/plugins/linteljs/.claude-plugin/plugin.json');
  expect(packed).not.toContain('.claude-plugin/types');
  expect(packed).not.toContain('plugins/linteljs/tsconfig.json');
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
  ['commitGateHook.ts', commandPayload('git commit -m x')],
  ['commitGateHook.ts', cursorShellPayload('git commit')],
  ['dependencyAskHook.ts', commandPayload('pnpm add zod')],
  ['dependencyAskHook.ts', copilotPayload('bash', { command: 'npm i lodash' })],
  ['dependencyAskHook.ts', cursorShellPayload('yarn add react')],
  ['dependencyAskHook.ts', cursorToolPayload('pnpm add zod', 'preToolUse')],
  ['generatedFileGuardHook.ts', { tool_input: { file_path: 'missing.ts' } }],
  ['generatedFileGuardHook.ts', copilotPayload('edit', { path: 'missing.ts' })],
];

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

  it.each([
    [
      'Claude Code\'s deny under Copilot',
      'copilot',
      '{"hookSpecificOutput":{"hookEventName":"PreToolUse",'
      + '"permissionDecision":"deny","permissionDecisionReason":"x"}}\n',
    ],
    [
      'Copilot\'s deny under Cursor',
      'cursor',
      '{"permissionDecision":"deny","permissionDecisionReason":"x"}\n',
    ],
    [
      'Cursor\'s allow under Claude Code',
      'claude',
      '{"permission":"allow"}\n',
    ],
  ] as const)('refuses %s', (_label, host, stdout) => {
    expect(() => {
      return expectDecisionOutput('gitSafetyGuardHook.ts', stdout, host);
    }).toThrow();
  });
});
