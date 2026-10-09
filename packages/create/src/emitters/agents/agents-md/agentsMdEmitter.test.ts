import { agentWorkspaceFor, targets } from '@mocks/agentRules';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Agent } from '@config/types';

import { workspaceOf } from '../../utils/layoutUtils';

import { agentsMdEmitter } from './agentsMdEmitter';

describe('agentsMdEmitter', () => {
  it.each<Agent>([
    'antigravity',
    'codex',
    'gemini-cli',
  ])('writes a preserved AGENTS.md for %s', (agent) => {
    const artifacts = agentsMdEmitter(agentWorkspaceFor([agent]));
    const written = targets(artifacts);

    expect(written).toEqual(['AGENTS.md']);
    expect(artifacts[0]?.preserve).toBe(true);
  });

  it('writes AGENTS.md once for all three, and CLAUDE.md for Claude Code', () => {
    const artifacts = agentsMdEmitter(agentWorkspaceFor([
      'antigravity',
      'claude-code',
      'codex',
      'gemini-cli',
    ]));
    const written = targets(artifacts);

    expect(written).toEqual(['CLAUDE.md', 'AGENTS.md']);
  });

  it('writes nothing for an agent that reads its own file', () => {
    const artifacts = agentsMdEmitter(agentWorkspaceFor(['copilot', 'cursor']));

    expect(artifacts).toEqual([]);
  });

  it('writes each project\'s facts beside its root adapter in a monorepo', () => {
    const { projects: [{ answers }] } = agentWorkspaceFor(['claude-code']);
    const workspace = workspaceOf('acme', [
      { name: 'web', answers: { ...answers, layout: 'monorepo' } },
      { name: 'shared', answers: {
        ...answers,
        layout: 'monorepo',
        target: 'typescript',
      } },
    ]);
    const written = targets(agentsMdEmitter(workspace));

    expect(written).toEqual([
      'CLAUDE.md',
      'apps/web/CLAUDE.md',
      'packages/shared/CLAUDE.md',
    ]);
  });
});
