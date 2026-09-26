import { type Artifact } from '@config/types';

import { adapterArtifact } from '../utils/adapterUtils';
import { globsOf, ruleArtifacts } from '../utils/ruleFileUtils';

import type { Answers } from '@answers';

export const copilotArtifacts = (answers: Answers): Artifact[] => {
  return [
    adapterArtifact('.github/copilot-instructions.md', answers),
    // `**` where the rule lists no paths: it governs any file, which is what Copilot reads that glob as.
    ...ruleArtifacts(answers, '.github/instructions', '.instructions.md', (source) => {
      const globs = globsOf(source);

      return `---\napplyTo: "${globs === '' ? '**' : globs}"\n---\n\n`;
    }),
  ];
};

export const copilotInstructionsEmitter = (answers: Answers): Artifact[] => {
  return answers.agents.includes('copilot') ? copilotArtifacts(answers) : [];
};
