import {
  RULE,
  targets,
  transformOf,
} from '@mocks/agentRules';
import { soloOf } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { globsOf, ruleArtifacts } from './ruleFileUtils';

describe('globsOf', () => {
  it('reads the shared paths list as one glob string, and an absent one as empty', () => {
    const globs = globsOf(RULE, ['.']);
    expect(globs).toBe('src/**/*.ts,src/**/*.tsx,tsconfig.json');
    const noFrontmatterHereGlobs = globsOf('# No frontmatter here.\n', ['.']);
    expect(noFrontmatterHereGlobs).toBe('');
  });

  it('reads paths only from frontmatter that opens the file', () => {
    const globs = globsOf('# Title\n\n---\npaths:\n  - "src/**"\n---\n', ['.']);
    expect(globs).toBe('');
  });

  it('expands every brace group, since both tools split the string on its commas', () => {
    const globs = globsOf('---\npaths:\n  - "**/*.{test,spec}.{ts,tsx}"\n---\n', ['.']);

    expect(globs)
      .toBe('**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx');
  });

  it('reaches into every package of a monorepo, and leaves a glob that already does', () => {
    const globs = globsOf('---\npaths:\n  - "src/**/*.ts"\n  - "**/*.tsx"\n---\n', ['**']);

    expect(globs).toBe('**/src/**/*.ts,**/*.tsx');
  });

  it('roots every glob in each project directory of a workspace', () => {
    const globs = globsOf('---\npaths:\n  - "src/**/*.ts"\n  - "**/*.tsx"\n---\n', ['apps/web', 'apps/admin']);

    expect(globs).toBe('apps/web/src/**/*.ts,apps/admin/src/**/*.ts,apps/web/**/*.tsx,apps/admin/**/*.tsx');
  });
});

describe('ruleArtifacts', () => {
  it('renames each rule into the given directory and suffix and swaps in the tool frontmatter', () => {
    const artifacts = ruleArtifacts(soloOf(DEFAULT_ANSWERS), '.rules', '.mdc', (_source, globs) => {
      return `---\napplyTo: ${globs.split(',')[0] ?? ''}\n---\n`;
    });

    const actual = targets(artifacts);
    expect(actual).toContain('.rules/repo-structure.mdc');
    expect(artifacts[0]?.stage).toBe('standard');

    const transform = transformOf(artifacts, '.rules/repo-structure.mdc');
    const rewritten = transform(RULE, null);

    expect(rewritten)
      .toBe('---\napplyTo: src/**/*.ts\n---\n# Repository Structure\n\nBody.\n');

    const paddedRule = RULE.replace('---\n\n#', '---\n\n\n#');
    const rewrittenFromPadded = transform(paddedRule, null);

    expect(rewrittenFromPadded)
      .toBe('---\napplyTo: src/**/*.ts\n---\n# Repository Structure\n\nBody.\n');
  });
});
