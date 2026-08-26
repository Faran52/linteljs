import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type TargetId,
} from '../../model/answers/answers';

import { allowBuildsBlock, emitPnpmWorkspace } from './emitPnpmWorkspace';
import { mergePnpmWorkspace } from './mergePnpmWorkspace';

interface AnswerOverrides {
  target?: TargetId;
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
    const merged = mergePnpmWorkspace(existing, answersFor({}));

    // The list is untouched; the peer block that follows is decided on its own.
    expect(merged.startsWith(existing)).toBe(true);
    expect(merged).toContain('peerDependencyRules:');
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
  const existing = "allowBuilds:\n  'sharp': true\n";

  it('adds the block to a project that already has allowBuilds but not the rules', () => {
    const merged = mergePnpmWorkspace(existing, answersFor({ target: 'next' }));

    // The project's own allowBuilds list survives: one name, not the two this CLI would have written.
    expect(merged).toContain("allowBuilds:\n  'sharp': true");
    expect(merged).not.toContain('unrs-resolver');
    expect(merged).toContain("    'eslint-plugin-jsx-a11y>eslint': '10'");
  });

  // Already there is the project's: a hand-widened range is not this CLI's to narrow back.
  it('leaves an existing peerDependencyRules block alone', () => {
    const withRules = `${existing}\npeerDependencyRules:\n  allowedVersions:\n    'mine>eslint': '9'\n`;
    const merged = mergePnpmWorkspace(withRules, answersFor({ target: 'next' }));

    expect(merged).toBe(withRules);
  });

  // Every target installs the resolver that drags the inert plugin, so every target gets a block. Vue is one whose
  // tree has nothing else in it: it renders templates, not JSX.
  it('names no accessibility allowance for a target that does not use it', () => {
    const merged = mergePnpmWorkspace(existing, answersFor({ target: 'vue' }));

    expect(merged).toContain("    'eslint-plugin-import>eslint': '10'");
    expect(merged).not.toContain('eslint-plugin-jsx-a11y>');
  });
});

// What create-next-app actually leaves: its own opt-out block, no allowBuilds, on the one target with capped plugins.
it('adds both blocks to a next scaffold that has neither', () => {
  const merged = mergePnpmWorkspace('ignoredBuiltDependencies:\n  - sharp\n', answersFor({ target: 'next' }));

  expect(merged).toContain("allowBuilds:\n  'sharp': true");
  expect(merged).toContain("    'eslint-plugin-jsx-a11y>eslint': '10'");
  expect(merged).not.toContain('ignoredBuiltDependencies');
});
