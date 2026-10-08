import { type Artifact, type Workspace } from '@config/types';

import { ruleArtifacts } from '../utils/ruleFileUtils';

// Antigravity drops a rule without a `trigger`, so the repository-wide half is `always_on`.
export const antigravityRulesEmitter = (workspace: Workspace): Artifact[] => {
  const [{ answers }] = workspace.projects;

  if (!answers.agents.includes('antigravity')) {
    return [];
  }

  return ruleArtifacts(workspace, '.agents/rules', '.md', (source, globs) => {
    const trigger = globs === '' ? 'trigger: always_on' : `trigger: glob\nglobs: ${globs}`;

    return `---\n${trigger}\n---\n\n`;
  });
};
