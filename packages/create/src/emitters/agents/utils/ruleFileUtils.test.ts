import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '#answers';

import { globsOf, ruleArtifacts } from './ruleFileUtils';

import {
  RULE,
  targets,
  transformOf,
} from '#mocks/agentRules';

describe('globsOf', () => {
  // One comma-separated string, which is how both tools spell a multi-glob. Empty where a rule governs any file
  // rather than a set of them, which three of the shipped ones do.
  it('reads the shared paths list as one glob string, and an absent one as empty', () => {
    expect(globsOf(RULE)).toBe('src/**/*.{ts,tsx},tsconfig.json');
    expect(globsOf('# No frontmatter here.\n')).toBe('');
  });
});

describe('ruleArtifacts', () => {
  // The rename and the frontmatter swap are the whole helper: the body below the `paths:` block travels unchanged.
  it('renames each rule into the given directory and suffix and swaps in the tool frontmatter', () => {
    const artifacts = ruleArtifacts(DEFAULT_ANSWERS, '.rules', '.mdc', () => {
      return '---\napplyTo: src\n---\n';
    });

    expect(targets(artifacts)).toContain('.rules/repo-structure.mdc');
    expect(artifacts[0]?.stage).toBe('standard');
    expect(transformOf(artifacts, '.rules/repo-structure.mdc')(RULE, null))
      .toBe('---\napplyTo: src\n---\n# Repository Structure\n\nBody.\n');
  });
});
