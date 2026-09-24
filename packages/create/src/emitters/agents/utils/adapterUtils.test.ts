import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { adapterArtifact, emitAgentAdapter } from './adapterUtils';

describe('emitAgentAdapter', () => {
  // The one body CLAUDE.md, AGENTS.md, Copilot's instructions and Cursor's rule all carry.
  it('points at the skill, the gate and the git bans, and nothing else', () => {
    expect(emitAgentAdapter(DEFAULT_ANSWERS)).toBe(`# LintelJS project

- Follow \`plugins/linteljs/skills/linteljs/SKILL.md\` for project structure, types, state, and tests.
- Read \`package.json\` for exact scripts and dependency versions.
- Run \`pnpm check\` before declaring implementation work complete.
- Run \`pnpm lint:fix\`, not lint without fixes.
- Never use \`git stash\`, \`git reset\`, \`--no-verify\`, \`--amend\`, \`git add -A\`, or \`git add .\`.
- Commit messages carry no \`Co-Authored-By\` or tool-attribution trailers.
`);
  });

  // npm is the one manager that needs `run` before a script name, and every command line in the file carries it.
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

// `yarn check` on 1.x is yarn's own lockfile check, so a classic project reaches its gate through `run`.
it('sends a classic project through run, where berry needs none', () => {
  expect(emitAgentAdapter({
    ...DEFAULT_ANSWERS,
    packageManager: 'yarn-classic',
  })).toContain('`yarn run check`');

  expect(emitAgentAdapter({
    ...DEFAULT_ANSWERS,
    packageManager: 'yarn',
  })).toContain('`yarn check`');
});
