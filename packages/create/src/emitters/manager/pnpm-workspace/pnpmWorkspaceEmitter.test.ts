import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { mergePnpmWorkspace, pnpmWorkspaceEmitter } from './pnpmWorkspaceEmitter';
import { allowBuildsBlock, RELEASE_AGE_BLOCK } from './utils/emitUtils';

describe('pnpmWorkspaceEmitter', () => {
  it('owns the workspace file only under pnpm', () => {
    expect(pnpmWorkspaceEmitter(answersFor({ packageManager: 'pnpm' }))).toHaveLength(1);
    expect(pnpmWorkspaceEmitter(answersFor({ packageManager: 'npm' }))).toEqual([]);
  });

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
    const expected = `${allowBuildsBlock(answersFor({}))}\n${RELEASE_AGE_BLOCK}`;

    expect(mergePnpmWorkspace(null, answersFor({}))).toBe(expected);
  });

  it('prepends the allowBuilds block to an existing file that has none', () => {
    const merged = mergePnpmWorkspace('onlyBuiltDependencies:\n  - foo\n', answersFor({}));

    const expected = `${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n\n${RELEASE_AGE_BLOCK}`;

    expect(merged).toBe(expected);
  });

  it('drops the ignoredBuiltDependencies block a scaffolder wrote, list and all', () => {
    const existing = 'ignoredBuiltDependencies:\n  - sharp\n  - unrs-resolver\nonlyBuiltDependencies:\n  - foo\n';

    expect(mergePnpmWorkspace(existing, answersFor({})))
      .toBe(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n\n${RELEASE_AGE_BLOCK}`);
  });

  it('drops a superseded list across a blank line inside it', () => {
    const existing = 'ignoredBuiltDependencies:\n  - sharp\n\n  - unrs-resolver\nonlyBuiltDependencies:\n  - foo\n';

    expect(mergePnpmWorkspace(existing, answersFor({})))
      .toBe(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n\n${RELEASE_AGE_BLOCK}`);
  });

  it('drops a superseded key written as an inline list', () => {
    expect(mergePnpmWorkspace('ignoredBuiltDependencies: [sharp]\nonlyBuiltDependencies:\n  - foo\n', answersFor({})))
      .toBe(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n\n${RELEASE_AGE_BLOCK}`);
  });

  it('closes the gap the blank lines opening a file would leave under the prepended block', () => {
    expect(mergePnpmWorkspace('\n\nonlyBuiltDependencies:\n  - foo\n', answersFor({})))
      .toBe(`${allowBuildsBlock(answersFor({}))}onlyBuiltDependencies:\n  - foo\n\n${RELEASE_AGE_BLOCK}`);
  });

  it('keeps the document marker a file opens with', () => {
    const existing = "---\nallowBuilds:\n  'some-native': true\n";

    expect(mergePnpmWorkspace(existing, answersFor({}))).toBe(`${existing}\n${RELEASE_AGE_BLOCK}`);
  });

  it('leaves a release-age policy the project set alone', () => {
    const existing = "allowBuilds:\n  'sharp': true\nminimumReleaseAge: 60\n";

    expect(mergePnpmWorkspace(existing, answersFor({}))).toBe(existing);
  });

  it('adds the block to a file that only mentions it in a comment', () => {
    const merged = mergePnpmWorkspace('# allowBuilds: is added\n', answersFor({}));

    expect(merged).toMatch(/^allowBuilds:/mu);
  });

  it('leaves an existing allowBuilds block alone rather than reasserting over it', () => {
    const existing = "allowBuilds:\n  'sharp': true\n  'unrs-resolver': true\n  'custom-pkg': true\n";

    expect(mergePnpmWorkspace(existing, answersFor({}))).toBe(`${existing}\n${RELEASE_AGE_BLOCK}`);
  });

  it('keeps content that follows the dropped block, not just what precedes it', () => {
    const existing = 'ignoredBuiltDependencies:\n  - sharp\nonlyBuiltDependencies:\n  - foo\n';
    const merged = mergePnpmWorkspace(existing, answersFor({}));

    expect(merged).toContain('onlyBuiltDependencies:\n  - foo\n');
  });
});

describe('the NativeWind lightningcss pin', () => {
  const nativewind = answersFor({
    target: 'react-native',
    styling: 'tailwind',
  });

  it('appends the override block for react-native with tailwind', () => {
    const merged = mergePnpmWorkspace(null, nativewind);
    const metro = "'@expo/metro-config>lightningcss': '1.30.1'";
    const css = "'react-native-css>lightningcss': '1.30.1'";

    expect(merged).toContain(`\n\noverrides:\n  ${metro}\n  ${css}\n`);
  });

  it('leaves an overrides block the project wrote alone', () => {
    const existing = "allowBuilds:\n  'sharp': true\nminimumReleaseAge: 60\noverrides:\n  left-pad: 1.0.0\n";

    expect(mergePnpmWorkspace(existing, nativewind)).toBe(existing);
  });

  it('writes no override without NativeWind', () => {
    const merged = mergePnpmWorkspace(null, answersFor({ target: 'react-native' }));

    expect(merged).not.toContain('overrides:');
  });
});

it('adds allowBuilds to a next scaffold that has none', () => {
  const merged = mergePnpmWorkspace('ignoredBuiltDependencies:\n  - sharp\n', answersFor({ target: 'next' }));

  expect(merged).toContain("allowBuilds:\n  '@swc/core': true");
  expect(merged).not.toContain('ignoredBuiltDependencies');
});
