import {
  type Agent,
  type Artifact,
  type Workspace,
} from '@config/types';

import { instructionArtifacts } from '../utils/adapterUtils';

const READERS: Record<string, Agent[]> = {
  'CLAUDE.md': ['claude-code'],
  'AGENTS.md': [
    'antigravity',
    'codex',
    'gemini-cli',
  ],
};

export const agentsMdEmitter = (workspace: Workspace): Artifact[] => {
  const [{ answers }] = workspace.projects;

  return Object.entries(READERS)
    .filter(([, readers]) => {
      return readers
        .some((agent) => {
          return answers.agents.includes(agent);
        });
    })
    .flatMap(([file]) => {
      return instructionArtifacts(workspace, file);
    });
};
