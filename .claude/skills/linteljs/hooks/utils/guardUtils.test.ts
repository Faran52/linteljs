import { expect, test } from 'claude-code/testing';

import { leftoverNote } from './guardUtils.ts';

test('names the worktrees no pending, running or waiting agent owns', () => {
  const names = ['agent-a', 'agent-b', 'agent-c', 'agent-d', 'agent-e'];
  const agents = [
    { id: 'a', status: 'pending' },
    { id: 'b', status: 'running' },
    { id: 'c', status: 'waiting' },
    { id: 'd', status: 'completed' },
  ];
  const note = leftoverNote(names, agents);

  expect(note).toBe('linteljs: worktrees no running agent owns sit under .claude/worktrees: agent-d, agent-e. '
    + 'Merge or drop what each holds, then `git worktree remove` it.');
});

test('says nothing when every worktree has a live agent, or there is none', () => {
  const owned = leftoverNote(['agent-a'], [{ id: 'a', status: 'running' }]);
  const none = leftoverNote([], [{ id: 'a', status: 'completed' }]);

  expect(owned).toBeUndefined();
  expect(none).toBeUndefined();
});
