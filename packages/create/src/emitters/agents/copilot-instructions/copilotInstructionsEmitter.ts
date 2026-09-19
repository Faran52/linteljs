import { type Artifact } from '../../../config/types';
import { emitted } from '../../utils/artifactUtils';
import { emitAgentAdapter } from '../utils/adapterUtils';
import { globsOf, ruleArtifacts } from '../utils/ruleFileUtils';

import type { Answers } from '../../../answers/answers';

export const copilotArtifacts = (answers: Answers): Artifact[] => {
  return [
    {
      ...emitted('standard', '.github/copilot-instructions.md', emitAgentAdapter(answers)),
      preserve: true,
    },
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
