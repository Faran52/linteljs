import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Browser,
  type Data,
  DEFAULT_ANSWERS,
  type Styling,
  type TargetId,
} from '@answers';

import { mergePnpmWorkspace } from './pnpmWorkspaceEmitter';
import { allowBuildsBlock, emitPnpmWorkspace } from './utils/emitUtils';

interface AnswerOverrides {
  target?: TargetId;
  browser?: Browser;
  styling?: Styling;
  data?: Data;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

describe('mergePnpmWorkspace', () => {
  it('writes the emitted block alone when there is no existing file', () => {
    expect(mergePnpmWorkspace(null, answersFor({}))).toBe(emitPnpmWorkspace(answersFor({})));
  });

  it('prepends the allowBuilds block to an existing file that has none', () => {
    const merged = mergePnpmWorkspace('onlyBuiltDependencies:\n  - foo\n', answersFor({}));

    expect(merged).toContain(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n`);
  });

  it('drops the ignoredBuiltDependencies block a scaffolder wrote', () => {
    const existing = 'ignoredBuiltDependencies:\n  - sharp\n  - unrs-resolver\nonlyBuiltDependencies:\n  - foo\n';
    const merged = mergePnpmWorkspace(existing, answersFor({}));

    expect(merged).not.toContain('ignoredBuiltDependencies');
    expect(merged).toContain('onlyBuiltDependencies:\n  - foo\n');
  });

  it('leaves an existing allowBuilds block alone rather than reasserting over it', () => {
    const existing = "allowBuilds:\n  'sharp': true\n  'unrs-resolver': true\n  'custom-pkg': true\n";

    // Angular, because it is one of the two targets that still caps a peer: the list is untouched and the block
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
    const merged = mergePnpmWorkspace(existing, answersFor({ target: 'react-native' }));

    // The project's own allowBuilds list survives untouched, and the names this CLI would have written are not added.
    expect(merged).toContain("allowBuilds:\n  'some-native': true");
    expect(merged).not.toContain('unrs-resolver');
    expect(merged).toContain('peerDependencyRules:');
    expect(merged).toContain("    '@react-native/community-cli-plugin>@react-native/metro-config'");
  });

  // Already there is the project's: a hand-widened range is not this CLI's to narrow back.
  it('leaves an existing peerDependencyRules block alone', () => {
    const withRules = `${existing}\npeerDependencyRules:\n  allowedVersions:\n    'mine>eslint': '9'\n`;
    const merged = mergePnpmWorkspace(withRules, answersFor({ target: 'react-native' }));

    expect(merged).toBe(withRules);
  });

  /**
   * The common case, and the one that used to be impossible: nothing this project installs caps a peer, so the file
   * is the build list alone. Measured before it was removed: no lockfile here has `eslint-plugin-import` or
   * `eslint-plugin-jsx-a11y` in it, the layers take the two forks, and `eslint-plugin-astro` peers the fork itself.
   */
  it('writes no rules block for a target with nothing capped', () => {
    for (const target of ['vue', 'next', 'astro'] as const) {
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
