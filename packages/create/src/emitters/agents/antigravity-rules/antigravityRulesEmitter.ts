import { type Answers, type Artifact } from '@config/types';

import { globsOf, ruleArtifacts } from '../utils/ruleFileUtils';

// Antigravity drops a rule without a `trigger`, so the repository-wide half is `always_on`.
export const antigravityRulesEmitter = (answers: Answers): Artifact[] => {
  if (!answers.agents.includes('antigravity')) {
    return [];
  }

  return ruleArtifacts(answers, '.agents/rules', '.md', (source) => {
    const globs = globsOf(source, answers.layout);
    const trigger = globs === '' ? 'trigger: always_on' : `trigger: glob\nglobs: ${globs}`;

    return `---\n${trigger}\n---\n\n`;
  });
};
