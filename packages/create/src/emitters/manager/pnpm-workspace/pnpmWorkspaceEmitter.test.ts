import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { mergePnpmWorkspace, pnpmWorkspaceEmitter } from './pnpmWorkspaceEmitter';
import { allowBuildsBlock } from './utils/emitUtils';

describe('pnpmWorkspaceEmitter', () => {
  it('owns the workspace file only under pnpm', () => {
    expect(pnpmWorkspaceEmitter(answersFor({ packageManager: 'pnpm' }))).toHaveLength(1);
    expect(pnpmWorkspaceEmitter(answersFor({ packageManager: 'npm' }))).toEqual([]);
  });

  // Read off the artifact rather than the merge, so the file on disk is what reaches it.
  it("drops create-next-app's build opt-out, which would fail the install, and keeps the rest of the file", () => {
    const [artifact] = pnpmWorkspaceEmitter(answersFor({ target: 'next' }));
    const scaffolded = 'ignoredBuiltDependencies:\n  - sharp\n  - unrs-resolver\noverrides:\n  left-pad: 1.0.0\n';
    const merged = artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(scaffolded) : '';

    expect(merged).not.toContain('ignoredBuiltDependencies');
    expect(merged).toContain("'unrs-resolver': true");
    expect(merged).toContain('overrides:\n  left-pad: 1.0.0\n');
  });
});

describe('mergePnpmWorkspace', () => {
  it('writes the emitted block alone when there is no existing file', () => {
    expect(mergePnpmWorkspace(null, answersFor({}))).toBe(allowBuildsBlock(answersFor({})));
  });

  it('prepends the allowBuilds block to an existing file that has none', () => {
    const merged = mergePnpmWorkspace('onlyBuiltDependencies:\n  - foo\n', answersFor({}));

    expect(merged).toContain(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n`);
  });

  it('drops the ignoredBuiltDependencies block a scaffolder wrote, list and all', () => {
    const existing = 'ignoredBuiltDependencies:\n  - sharp\n  - unrs-resolver\nonlyBuiltDependencies:\n  - foo\n';

    expect(mergePnpmWorkspace(existing, answersFor({})))
      .toBe(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n`);
  });

  // A blank line inside a YAML list does not end it, so it does not end the drop either.
  it('drops a superseded list across a blank line inside it', () => {
    const existing = 'ignoredBuiltDependencies:\n  - sharp\n\n  - unrs-resolver\nonlyBuiltDependencies:\n  - foo\n';

    expect(mergePnpmWorkspace(existing, answersFor({})))
      .toBe(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n`);
  });

  it('drops a superseded key written as an inline list', () => {
    expect(mergePnpmWorkspace('ignoredBuiltDependencies: [sharp]\nonlyBuiltDependencies:\n  - foo\n', answersFor({})))
      .toBe(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n`);
  });

  it('closes the gap the blank lines opening a file would leave under the prepended block', () => {
    expect(mergePnpmWorkspace('\n\nonlyBuiltDependencies:\n  - foo\n', answersFor({})))
      .toBe(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n`);
  });

  // An indented or dashed line before any key is not a key, so nothing ahead of the first one is dropped.
  it('keeps the document marker a file opens with when it has nothing to add', () => {
    const existing = "---\nallowBuilds:\n  'some-native': true\n";

    expect(mergePnpmWorkspace(existing, answersFor({}))).toBe(existing);
  });

  // Only a key at the start of a line is the block; a comment naming it is not.
  it('adds the block to a file that only mentions it in a comment', () => {
    const merged = mergePnpmWorkspace('# allowBuilds: is added\n', answersFor({}));

    expect(merged).toMatch(/^allowBuilds:/mu);
  });

  it('leaves an existing allowBuilds block alone rather than reasserting over it', () => {
    const existing = "allowBuilds:\n  'sharp': true\n  'unrs-resolver': true\n  'custom-pkg': true\n";

    expect(mergePnpmWorkspace(existing, answersFor({}))).toBe(existing);
  });

  it('keeps content that follows the dropped block, not just what precedes it', () => {
    const existing = 'ignoredBuiltDependencies:\n  - sharp\nonlyBuiltDependencies:\n  - foo\n';
    const merged = mergePnpmWorkspace(existing, answersFor({}));

    expect(merged).toContain('onlyBuiltDependencies:\n  - foo\n');
  });
});

// What create-next-app actually leaves: its own opt-out block and no allowBuilds.
it('adds allowBuilds to a next scaffold that has none', () => {
  const merged = mergePnpmWorkspace('ignoredBuiltDependencies:\n  - sharp\n', answersFor({ target: 'next' }));

  expect(merged).toContain("allowBuilds:\n  '@swc/core': true");
  expect(merged).not.toContain('ignoredBuiltDependencies');
});
