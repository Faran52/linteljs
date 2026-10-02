import {
  describe,
  expect,
  it,
} from 'vitest';

import { gitignoreEmitter, mergeGitignore } from './gitignoreEmitter';

describe('mergeGitignore', () => {
  it('appends what linteljs produces to the list the scaffolder wrote', () => {
    const mergedGitignore = mergeGitignore('node_modules\ndist\n');

    expect(mergedGitignore)
      .toBe('node_modules\ndist\n\n# linteljs\ncoverage/\n*.tsbuildinfo\n');
  });

  it('terminates a last line the generator left unterminated', () => {
    const mergedGitignore = mergeGitignore('node_modules');
    expect(mergedGitignore).toBe('node_modules\n\n# linteljs\ncoverage/\n*.tsbuildinfo\n');
  });

  it('writes the block alone where there is no .gitignore at all', () => {
    const mergedGitignore = mergeGitignore(null);
    expect(mergedGitignore).toBe('# linteljs\ncoverage/\n*.tsbuildinfo\n');
  });

  it('adds nothing a second time', () => {
    const once = mergeGitignore('node_modules\n');

    const mergedGitignore = mergeGitignore(once);
    expect(mergedGitignore).toBe(once);
  });

  it('adds only the entry that is missing', () => {
    const mergedGitignore = mergeGitignore('coverage/\n');
    expect(mergedGitignore).toBe('coverage/\n\n# linteljs\n*.tsbuildinfo\n');
  });

  it('recognises an entry it already added on a CRLF line ending', () => {
    const mergedGitignore = mergeGitignore('coverage/\r\n*.tsbuildinfo\r\n');
    expect(mergedGitignore).toBe('coverage/\r\n*.tsbuildinfo\r\n');
  });
});

describe('gitignoreEmitter', () => {
  it("keeps the generator's list and adds what linteljs's own scripts produce", () => {
    const [artifact] = gitignoreEmitter();

    expect(artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge('node_modules\n') : '')
      .toBe('node_modules\n\n# linteljs\ncoverage/\n*.tsbuildinfo\n');
  });
});
