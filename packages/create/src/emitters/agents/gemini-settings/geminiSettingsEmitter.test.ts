import { answersFor, targets } from '@mocks/agentRules';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  GEMINI_HOOKS,
  geminiSettingsEmitter,
  mergeGeminiSettings,
} from './geminiSettingsEmitter';

const command = (name: string): object => {
  const entry = {
    type: 'command',
    command: `node "$GEMINI_PROJECT_DIR/plugins/linteljs/hooks/${name}Hook.ts"`,
  };

  return entry;
};

const OURS = {
  BeforeTool: [
    {
      matcher: 'run_shell_command',
      hooks: [command('gitSafetyGuard')],
    },
    {
      matcher: 'write_file|replace',
      hooks: [command('generatedFileGuard')],
    },
  ],
  AfterTool: [
    {
      matcher: 'run_shell_command',
      hooks: [command('eslintFixWarning')],
    },
    {
      matcher: 'write_file|replace',
      hooks: [command('bannedPatternGuard')],
    },
  ],
};

const THEIRS = {
  matcher: 'read_file',
  hooks: [
    {
      type: 'command',
      command: './audit.sh',
    },
  ],
};

describe('mergeGeminiSettings', () => {
  it('reads AGENTS.md beside GEMINI.md and runs the guards around the shell and edit tools', () => {
    const merged = mergeGeminiSettings(null);
    const parsed: unknown = JSON.parse(merged);

    expect(GEMINI_HOOKS).toEqual(OURS);

    expect(parsed).toEqual({
      context: { fileName: ['AGENTS.md', 'GEMINI.md'] },
      hooks: OURS,
    });

    const ended = merged.endsWith('}\n');
    expect(ended).toBe(true);
  });

  it('keeps a project\'s own settings and hooks and writes its own exactly once however often it runs', () => {
    const current = JSON.stringify({
      theme: 'dark',
      context: {
        fileName: 'CONTEXT.md',
        memoryBoundaryMarkers: ['.git'],
      },
      hooks: {
        BeforeTool: [THEIRS, 'stray'],
        SessionStart: [THEIRS],
        AfterAgent: [],
        Notification: 'stray',
      },
    });
    const once = mergeGeminiSettings(current);
    const twice = mergeGeminiSettings(once);
    const parsed: unknown = JSON.parse(once);

    expect(twice).toBe(once);

    expect(parsed).toEqual({
      theme: 'dark',
      context: {
        fileName: [
          'AGENTS.md',
          'GEMINI.md',
          'CONTEXT.md',
        ],
        memoryBoundaryMarkers: ['.git'],
      },
      hooks: {
        BeforeTool: [THEIRS, ...OURS.BeforeTool],
        SessionStart: [THEIRS],
        AfterTool: OURS.AfterTool,
      },
    });
  });

  it('lists a context file once, and starts over from a context or hooks that is not an object', () => {
    const listed = JSON.stringify({ context: { fileName: ['GEMINI.md', 3] } });
    const stray = JSON.stringify({
      context: 'x',
      hooks: [[THEIRS]],
    });
    const fromListed: unknown = JSON.parse(mergeGeminiSettings(listed));
    const fromStray: unknown = JSON.parse(mergeGeminiSettings(stray));
    const expected = {
      context: { fileName: ['AGENTS.md', 'GEMINI.md'] },
      hooks: OURS,
    };

    expect(fromListed).toEqual(expected);
    expect(fromStray).toEqual(expected);
  });
});

describe('geminiSettingsEmitter', () => {
  it('writes .gemini/settings.json only where Gemini CLI was chosen', () => {
    const others = geminiSettingsEmitter(answersFor([
      'antigravity',
      'claude-code',
      'codex',
    ]));
    const artifacts = geminiSettingsEmitter(answersFor(['gemini-cli']));
    const written = targets(artifacts);

    expect(others).toEqual([]);
    expect(written).toEqual(['.gemini/settings.json']);
    expect(artifacts[0]?.stage).toBe('standard');
  });
});
