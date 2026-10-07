import {
  type Agent,
  type Answers,
  type Artifact,
} from '@config/types';

import { adapterArtifact } from '../utils/adapterUtils';

const READERS: Agent[] = [
  'antigravity',
  'codex',
  'gemini-cli',
];

export const agentsMdEmitter = (answers: Answers): Artifact[] => {
  const read = answers.agents
    .some((agent) => {
      return READERS.includes(agent);
    });

  const artifacts = read ? [adapterArtifact('AGENTS.md', answers)] : [];

  return artifacts;
};
