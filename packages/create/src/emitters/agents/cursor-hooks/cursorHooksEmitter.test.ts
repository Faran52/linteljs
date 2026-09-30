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
    ['JSON that is a string', '"hooks"'],
    ['no hooks key', '{"version":1}'],
    ['hooks that are no object', '{"hooks":[]}'],
  ])('reads %s as no hooks of the project\'s own', (_label, current) => {
    expect(JSON.parse(mergeCursorHooks(current))).toEqual({
      version: 1,
      hooks: OURS,
    });
  });

  it("keeps a project's hook that carries no command string", () => {
    const current = JSON.stringify({
      hooks: {
        stop: [{ prompt: 'check the diff' }, { command: 42 }],
      },
    });

    expect(JSON.parse(mergeCursorHooks(current))).toEqual({
      version: 1,
      hooks: {
        stop: [{ prompt: 'check the diff' }, { command: 42 }],
        ...OURS,
      },
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
    const pluginTargets = linteljsPluginEmitter(DEFAULT_ANSWERS)
      .map(({ target }) => {
        return target;
      });

    const shipped = new Set(pluginTargets);
    const scripts = [...JSON.stringify(CURSOR_HOOKS).matchAll(/node ([^"\s]+)"/gu)]
      .map((match) => {
        return match[1];
      });

    expect(scripts).toHaveLength(2);

    const allShipped = scripts
      .every((script) => {
        return script !== undefined && shipped.has(script);
      });

    expect(allShipped).toBe(true);
  });
});

describe('cursorHooksEmitter', () => {
  it.each([
    'claude-code',
    'codex',
    'copilot',
  ] as const)('writes nothing for %s without Cursor', (agent) => {
    expect(cursorHooksEmitter(answersFor([agent]))).toEqual([]);
  });

  it('merges .cursor/hooks.json and marks it removable', () => {
    const [artifact, ...rest] = cursorHooksEmitter(answersFor(['cursor']));

    expect(rest).toEqual([]);
    expect(artifact?.stage).toBe('standard');
    expect(artifact?.target).toBe('.cursor/hooks.json');
    expect(artifact?.removable).toBe(true);
    expect(artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(null) : '')
      .toBe(mergeCursorHooks(null));
  });
});
