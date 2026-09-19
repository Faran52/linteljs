import { type Artifact, emitted } from '../../artifact';

import type { Answers } from '../../../answers/answers';

export const emitAgentAdapter = (answers: Answers): string => {
  const run = answers.packageManager === 'npm' ? 'npm run' : answers.packageManager;

  return `# LintelJS project

- Follow \`plugins/linteljs/skills/linteljs/SKILL.md\` for project structure, types, state, and tests.
- Read \`package.json\` for exact scripts and dependency versions.
- Run \`${run} check\` before declaring implementation work complete.
- Run \`${run} lint:fix\`, not lint without fixes.
- Never use \`git stash\`, \`git reset\`, \`--no-verify\`, \`--amend\`, \`git add -A\`, or \`git add .\`.
- Commit messages carry no \`Co-Authored-By\` or tool-attribution trailers.
`;
};

// Preserved: a project's own instructions outrank a re-run.
export const adapterArtifact = (target: 'CLAUDE.md' | 'AGENTS.md', answers: Answers): Artifact => {
  return {
    ...emitted('standard', target, emitAgentAdapter(answers)),
    preserve: true,
  };
};
