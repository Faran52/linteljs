import { type Artifact, type Workspace } from '@config/types';

import { adapterArtifact } from '../utils/adapterUtils';
import { ruleArtifacts } from '../utils/ruleFileUtils';

export const copilotArtifacts = (workspace: Workspace): Artifact[] => {
  const artifacts: Artifact[] = [
    adapterArtifact('.github/copilot-instructions.md', workspace),
    // Copilot reads `**` as any file.
    ...ruleArtifacts(workspace, '.github/instructions', '.instructions.md', (source, globs) => {
      return `---\napplyTo: "${globs === '' ? '**' : globs}"\n---\n\n`;
    }),
  ];

  return artifacts;
};

export const copilotInstructionsEmitter = (workspace: Workspace): Artifact[] => {
  const [{ answers }] = workspace.projects;

  return answers.agents.includes('copilot') ? copilotArtifacts(workspace) : [];
};
