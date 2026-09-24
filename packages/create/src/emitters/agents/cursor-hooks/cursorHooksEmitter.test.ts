import { answersFor } from '@mocks/agentRules';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { linteljsPluginEmitter } from '../../always/linteljs-plugin/linteljsPluginEmitter';

import {
  CURSOR_HOOKS,
  cursorHooksEmitter,
  mergeCursorHooks,
} from './cursorHooksEmitter';

const OURS = {
  beforeShellExecution: [{ command: 'node plugins/linteljs/hooks/gitSafetyGuardHook.ts' }],
  postToolUse: [
    {
      command: 'node plugins/linteljs/hooks/eslintFixWarningHook.ts',
      matcher: 'Shell',
    },
  ],
};

const THEIRS = {
  command: '.cursor/hooks/format.sh',
};

describe('mergeCursorHooks', () => {
  // Cursor runs project hooks from the project root, so the path needs no variable.
  it('writes the git guard on the shell gate and the eslint warning after a shell tool', () => {
    const merged = mergeCursorHooks(null);

    expect(JSON.parse(merged)).toEqual({
      version: 1,
      hooks: OURS,
    });
    expect(merged.endsWith('}\n')).toBe(true);
  });

  it('keeps a project\'s own hooks and writes its own exactly once however often it runs', () => {
    const current = JSON.stringify({
      version: 1,
      hooks: {
        afterFileEdit: [THEIRS],
        postToolUse: [THEIRS],
      },
    });
    const once = mergeCursorHooks(current);

    expect(JSON.parse(once)).toEqual({
      version: 1,
      hooks: {
        afterFileEdit: [THEIRS],
        postToolUse: [THEIRS, ...OURS.postToolUse],
        beforeShellExecution: OURS.beforeShellExecution,
      },
    });
    expect(mergeCursorHooks(once)).toBe(once);
  });

  // A hook this CLI no longer writes goes with the event it emptied; a project's own entries are not its to judge.
  it('drops its own stale entries and an event they alone filled', () => {
    const current = JSON.stringify({
      version: 1,
      hooks: {
        preToolUse: [{ command: 'node plugins/linteljs/hooks/oldHook.ts' }],
        stop: [],
      },
    });

    expect(JSON.parse(mergeCursorHooks(current))).toEqual({
      version: 1,
      hooks: OURS,
    });
  });

  it.each([
    ['text that is not JSON', '{'],
    ['JSON that is no object', '[]'],
    ['no hooks key', '{"version":1}'],
    ['hooks that are no object', '{"hooks":[]}'],
  ])('reads %s as no hooks of the project\'s own', (_label, current) => {
    expect(JSON.parse(mergeCursorHooks(current))).toEqual({
      version: 1,
      hooks: OURS,
    });
  });

  it('drops an entry that is not a hook, and an event that is not a list', () => {
    const current = JSON.stringify({
      hooks: {
        stop: 'not a list',
        afterFileEdit: [THEIRS, 'not a hook'],
        beforeReadFile: [THEIRS],
      },
    });

    expect(JSON.parse(mergeCursorHooks(current))).toEqual({
      version: 1,
      hooks: {
        afterFileEdit: [THEIRS],
        beforeReadFile: [THEIRS],
        ...OURS,
      },
    });
  });

  it('runs only hook scripts the plugin tree ships', () => {
    const shipped = new Set(linteljsPluginEmitter(DEFAULT_ANSWERS).map(({ target }) => {
      return target;
    }));
    const scripts = [...JSON.stringify(CURSOR_HOOKS).matchAll(/node ([^"\s]+)"/gu)].map((match) => {
      return match[1];
    });

    expect(scripts).toHaveLength(2);
    expect(scripts.every((script) => {
      return script !== undefined && shipped.has(script);
    })).toBe(true);
  });
});

describe('cursorHooksEmitter', () => {
  it.each(['claude-code', 'codex', 'copilot'] as const)('writes nothing for %s without Cursor', (agent) => {
    expect(cursorHooksEmitter(answersFor([agent]))).toEqual([]);
  });

  // A merge, so sync keeps the project's own hooks, and removable, so dropping Cursor takes the file with it.
  it('merges .cursor/hooks.json and marks it removable', () => {
    const [artifact, ...rest] = cursorHooksEmitter(answersFor(['cursor']));

    expect(rest).toEqual([]);
    expect(artifact?.target).toBe('.cursor/hooks.json');
    expect(artifact?.removable).toBe(true);
    expect(artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(null) : '')
      .toBe(mergeCursorHooks(null));
  });
});
