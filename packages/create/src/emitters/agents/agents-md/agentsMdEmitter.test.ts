import { answersFor, targets } from '@mocks/agentRules';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Agent } from '@config/types';

import { agentsMdEmitter } from './agentsMdEmitter';

describe('agentsMdEmitter', () => {
  it.each<Agent>([
    'antigravity',
    'codex',
    'gemini-cli',
  ])('writes a preserved AGENTS.md for %s', (agent) => {
    const artifacts = agentsMdEmitter(answersFor([agent]));
    const written = targets(artifacts);

    expect(written).toEqual(['AGENTS.md']);
    expect(artifacts[0]?.preserve).toBe(true);
  });

  it('writes it once for all three', () => {
    const artifacts = agentsMdEmitter(answersFor([
      'antigravity',
      'codex',
      'gemini-cli',
    ]));
    const written = targets(artifacts);

    expect(written).toEqual(['AGENTS.md']);
  });

  it('writes nothing for an agent that reads its own file', () => {
    const artifacts = agentsMdEmitter(answersFor([
      'claude-code',
      'copilot',
      'cursor',
    ]));

    expect(artifacts).toEqual([]);
  });
});
