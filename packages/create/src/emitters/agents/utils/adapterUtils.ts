import { RUN_PREFIX } from '@config/constants';
import { type Answers, type Artifact } from '@config/types';

import { emitted } from '../../utils/artifactUtils';

export const emitAgentAdapter = (answers: Answers): string => {
  // The only table that knows `yarn run` from `yarn`.
  const run = RUN_PREFIX[answers.packageManager];

  return `# LintelJS project

- Before a change, follow \`plugins/linteljs/skills/linteljs/SKILL.md\`: it names the rule file for that kind of change.
- Read \`package.json\` for exact scripts and dependency versions.
- Run \`${run} check\` before declaring implementation work complete.
- Run \`${run} lint:fix\`, not lint without fixes.
- Comments are minimal: a short why, or none. Never restate the code; no comments in tests.
- Never use \`git stash\`, \`git reset\`, \`--no-verify\`, \`--amend\`, \`git add -A\`, or \`git add .\`.
- Commit messages carry no \`Co-Authored-By\` or tool-attribution trailers.
`;
};

// Preserved: a project's own instructions outrank a re-run.
export const adapterArtifact = (target: string, answers: Answers): Artifact => {
  return {
    ...emitted('standard', target, emitAgentAdapter(answers)),
    preserve: true,
  };
};
