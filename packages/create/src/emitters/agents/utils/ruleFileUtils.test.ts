import {
  RULE,
  targets,
  transformOf,
} from '@mocks/agentRules';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { globsOf, ruleArtifacts } from './ruleFileUtils';

describe('globsOf', () => {
  it('reads the shared paths list as one glob string, and an absent one as empty', () => {
    expect(globsOf(RULE)).toBe('src/**/*.{ts,tsx},tsconfig.json');
    expect(globsOf('# No frontmatter here.\n')).toBe('');
  });
});

describe('ruleArtifacts', () => {
  it('renames each rule into the given directory and suffix and swaps in the tool frontmatter', () => {
    const artifacts = ruleArtifacts(DEFAULT_ANSWERS, '.rules', '.mdc', () => {
      return '---\napplyTo: src\n---\n';
    });

    expect(targets(artifacts)).toContain('.rules/repo-structure.mdc');
    expect(artifacts[0]?.stage).toBe('standard');
    expect(transformOf(artifacts, '.rules/repo-structure.mdc')(RULE, null))
      .toBe('---\napplyTo: src\n---\n# Repository Structure\n\nBody.\n');
    expect(transformOf(artifacts, '.rules/repo-structure.mdc')(RULE.replace('---\n\n#', '---\n\n\n#'), null))
      .toBe('---\napplyTo: src\n---\n# Repository Structure\n\nBody.\n');
  });
});
