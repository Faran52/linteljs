import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { adapterArtifact, emitAgentAdapter } from './adapterUtils';

describe('emitAgentAdapter', () => {
  it('points at the skill, the gate, the comment rule and the git bans, and nothing else', () => {
    const agentAdapter = emitAgentAdapter(DEFAULT_ANSWERS);

    expect(agentAdapter).toBe(`# LintelJS project

- Before a change, follow \`plugins/linteljs/skills/linteljs/SKILL.md\`: it names the rule file for that kind of change.
- Read \`package.json\` for exact scripts and dependency versions.
- Run \`pnpm check\` before declaring implementation work complete.
- Run \`pnpm lint:fix\`, not lint without fixes.
- Comments are minimal: a short why, or none. Never restate the code; no comments in tests.
- Never use \`git stash\`, \`git reset\`, \`--no-verify\`, \`--amend\`, \`git add -A\`, or \`git add .\`.
- Commit messages carry no \`Co-Authored-By\` or tool-attribution trailers.
`);
  });

  it('spells every script the way the chosen manager runs it', () => {
    const adapter = emitAgentAdapter({
      ...DEFAULT_ANSWERS,
      packageManager: 'npm',
    });

    expect(adapter).toContain('`npm run check`');
    expect(adapter).toContain('`npm run lint:fix`');
  });
});

describe('adapterArtifact', () => {
  it('writes the adapter to the named file and leaves a project copy of it alone', () => {
    const artifact = adapterArtifact('AGENTS.md', DEFAULT_ANSWERS);

    expect(artifact.stage).toBe('standard');
    expect(artifact.target).toBe('AGENTS.md');
    expect(artifact.preserve).toBe(true);
    expect(artifact.content).toHaveProperty('text', expect.stringContaining('# LintelJS project'));
  });
});

it('runs the gate without `run` under yarn', () => {
  const berry = emitAgentAdapter({
    ...DEFAULT_ANSWERS,
    packageManager: 'yarn',
  });

  expect(berry).toContain('`yarn check`');
});
