import { type Artifact, emitted } from '../artifact';
import { emitAgentAdapter } from '../utils/adapterUtils';
import { globsOf, ruleArtifacts } from '../utils/ruleFileUtils';

import type { Answers } from '../../model/answers/answers';

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
