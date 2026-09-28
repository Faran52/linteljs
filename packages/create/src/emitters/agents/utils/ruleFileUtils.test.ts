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
    expect(globsOf(RULE)).toBe('src/**/*.ts,src/**/*.tsx,tsconfig.json');
    expect(globsOf('# No frontmatter here.\n')).toBe('');
  });

  it('reads paths only from frontmatter that opens the file', () => {
    expect(globsOf('# Title\n\n---\npaths:\n  - "src/**"\n---\n')).toBe('');
  });

  it('expands every brace group, since both tools split the string on its commas', () => {
    expect(globsOf('---\npaths:\n  - "**/*.{test,spec}.{ts,tsx}"\n---\n'))
      .toBe('**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx');
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
