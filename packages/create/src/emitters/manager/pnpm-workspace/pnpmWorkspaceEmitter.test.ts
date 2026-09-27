import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { mergePnpmWorkspace, pnpmWorkspaceEmitter } from './pnpmWorkspaceEmitter';
import { allowBuildsBlock, emitPnpmWorkspace } from './utils/emitUtils';

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
    expect(mergePnpmWorkspace(null, answersFor({}))).toBe(emitPnpmWorkspace(answersFor({})));
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
  it('adds both blocks to a file that only mentions them in a comment', () => {
    const merged = mergePnpmWorkspace('# allowBuilds: and peerDependencyRules: are added\n', answersFor({
      target: 'angular',
    }));

    expect(merged).toMatch(/^allowBuilds:/mu);
    expect(merged).toMatch(/^peerDependencyRules:/mu);
  });

  it('leaves an existing allowBuilds block alone rather than reasserting over it', () => {
    const existing = "allowBuilds:\n  'sharp': true\n  'unrs-resolver': true\n  'custom-pkg': true\n";

    // Angular, because it is the one target that caps a peer: the list is untouched and the block
    // follows it. A target that caps nothing gets the list alone, which the emitter's own suite holds.
    expect(mergePnpmWorkspace(existing, answersFor({ target: 'angular' })).startsWith(existing)).toBe(true);
    expect(mergePnpmWorkspace(existing, answersFor({ target: 'angular' }))).toContain('peerDependencyRules:');
    expect(mergePnpmWorkspace(existing, answersFor({}))).toBe(existing);
  });

  it('keeps content that follows the dropped block, not just what precedes it', () => {
    const existing = 'ignoredBuiltDependencies:\n  - sharp\nonlyBuiltDependencies:\n  - foo\n';
    const merged = mergePnpmWorkspace(existing, answersFor({}));

    expect(merged).toContain('onlyBuiltDependencies:\n  - foo\n');
  });
});

/**
 * The two blocks are decided separately, because a project generated before the peer rules existed already has
 * `allowBuilds` and would otherwise never gain them.
 */
describe('mergePnpmWorkspace: peerDependencyRules', () => {
  // A name this CLI never emits, so the survival below cannot pass by being written rather than kept.
  const existing = "allowBuilds:\n  'some-native': true\n";

  it('adds the block for a target that still caps a peer, and leaves allowBuilds alone', () => {
    const merged = mergePnpmWorkspace(existing, answersFor({ target: 'angular' }));

    // The project's own allowBuilds list survives untouched, and the names this CLI would have written are not added.
    expect(merged).toContain("allowBuilds:\n  'some-native': true");
    expect(merged).not.toContain('unrs-resolver');
    expect(merged).toContain('peerDependencyRules:');
    expect(merged).toContain("    '@angular/build>vitest'");
  });

  // Already there is the project's: a hand-widened range is not this CLI's to narrow back.
  it('leaves an existing peerDependencyRules block alone', () => {
    const withRules = `${existing}\npeerDependencyRules:\n  allowedVersions:\n    'mine>eslint': '9'\n`;
    const merged = mergePnpmWorkspace(withRules, answersFor({ target: 'angular' }));

    expect(merged).toBe(withRules);
  });

  /**
   * The common case: nothing this project installs caps a peer, so the file is the build list alone. The layers take
   * the two forks, and `eslint-plugin-astro` peers the fork itself.
   */
  it('writes no rules block for a target with nothing capped', () => {
    for (const target of ['vue', 'next', 'astro', 'react-native'] as const) {
      expect(mergePnpmWorkspace(existing, answersFor({ target }))).not.toContain('peerDependencyRules');
    }
  });
});

// What create-next-app actually leaves: its own opt-out block, no allowBuilds, on the one target with capped plugins.
it('adds both blocks to a next scaffold that has neither', () => {
  const merged = mergePnpmWorkspace('ignoredBuiltDependencies:\n  - sharp\n', answersFor({ target: 'next' }));

  expect(merged).toContain("allowBuilds:\n  '@swc/core': true");
  expect(merged).not.toContain('peerDependencyRules');
  expect(merged).not.toContain('ignoredBuiltDependencies');
});
