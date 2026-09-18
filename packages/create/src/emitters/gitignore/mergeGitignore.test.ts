import {
  describe,
  expect,
  it,
} from 'vitest';

import { mergeGitignore } from './mergeGitignore';

// coverage/ and *.tsbuildinfo come from scripts lintel writes, not the generator, so no generator ignores them.
describe('mergeGitignore', () => {
  it('appends what lintel produces to the list the scaffolder wrote', () => {
    expect(mergeGitignore('node_modules\ndist\n'))
      .toBe('node_modules\ndist\n\n# lintel\ncoverage/\n*.tsbuildinfo\n');
  });

  it('terminates a last line the generator left unterminated', () => {
    expect(mergeGitignore('node_modules')).toBe('node_modules\n\n# lintel\ncoverage/\n*.tsbuildinfo\n');
  });

  it('writes the block alone where there is no .gitignore at all', () => {
    expect(mergeGitignore(null)).toBe('# lintel\ncoverage/\n*.tsbuildinfo\n');
  });

  // Re-running `--skip-scaffold` must not stack a second block on every pass.
  it('adds nothing a second time', () => {
    const once = mergeGitignore('node_modules\n');

    expect(mergeGitignore(once)).toBe(once);
  });

  it('adds only the entry that is missing', () => {
    expect(mergeGitignore('coverage/\n')).toBe('coverage/\n\n# lintel\n*.tsbuildinfo\n');
  });

  // Splitting on `\n` alone leaves a trailing `\r` on a CRLF checkout, so an entry never matches and the block
  // duplicates.
  it('recognises an entry it already added on a CRLF line ending', () => {
    expect(mergeGitignore('coverage/\r\n*.tsbuildinfo\r\n')).toBe('coverage/\r\n*.tsbuildinfo\r\n');
  });
});
