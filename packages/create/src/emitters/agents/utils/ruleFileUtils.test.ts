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
    const globs = globsOf(RULE);
    expect(globs).toBe('src/**/*.ts,src/**/*.tsx,tsconfig.json');
    const noFrontmatterHereGlobs = globsOf('# No frontmatter here.\n');
    expect(noFrontmatterHereGlobs).toBe('');
  });

  it('reads paths only from frontmatter that opens the file', () => {
    const globs = globsOf('# Title\n\n---\npaths:\n  - "src/**"\n---\n');
    expect(globs).toBe('');
  });

  it('expands every brace group, since both tools split the string on its commas', () => {
    const globs = globsOf('---\npaths:\n  - "**/*.{test,spec}.{ts,tsx}"\n---\n');

    expect(globs)
      .toBe('**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx');
  });
});

describe('ruleArtifacts', () => {
  it('renames each rule into the given directory and suffix and swaps in the tool frontmatter', () => {
    const artifacts = ruleArtifacts(DEFAULT_ANSWERS, '.rules', '.mdc', () => {
      return '---\napplyTo: src\n---\n';
    });

    const actual = targets(artifacts);
    expect(actual).toContain('.rules/repo-structure.mdc');
    expect(artifacts[0]?.stage).toBe('standard');

    const actual2 = transformOf(artifacts, '.rules/repo-structure.mdc')(RULE, null);

    expect(actual2)
      .toBe('---\napplyTo: src\n---\n# Repository Structure\n\nBody.\n');

    const actual3 = transformOf(artifacts, '.rules/repo-structure.mdc')(RULE.replace('---\n\n#', '---\n\n\n#'), null);

    expect(actual3)
      .toBe('---\napplyTo: src\n---\n# Repository Structure\n\nBody.\n');
  });
});
