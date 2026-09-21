import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { adapterArtifact, emitAgentAdapter } from './adapterUtils';

describe('emitAgentAdapter', () => {
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
