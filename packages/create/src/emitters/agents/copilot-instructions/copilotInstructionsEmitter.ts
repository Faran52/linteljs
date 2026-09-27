import { type Answers, type Artifact } from '@config/types';

import { adapterArtifact } from '../utils/adapterUtils';
import { globsOf, ruleArtifacts } from '../utils/ruleFileUtils';

export const copilotArtifacts = (answers: Answers): Artifact[] => {
  return [
    adapterArtifact('.github/copilot-instructions.md', answers),
    // Copilot reads `**` as any file.
    ...ruleArtifacts(answers, '.github/instructions', '.instructions.md', (source) => {
      const globs = globsOf(source);

      return `---\napplyTo: "${globs === '' ? '**' : globs}"\n---\n\n`;
    }),
  ];
};

export const copilotInstructionsEmitter = (answers: Answers): Artifact[] => {
  return answers.agents.includes('copilot') ? copilotArtifacts(answers) : [];
};
