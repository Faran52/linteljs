import { ruleSources } from '../../always/linteljs-plugin/linteljsPluginEmitter';

import type { Answers } from '@answers';
import type { Artifact } from '@config/types';

const PATHS = /^---\npaths:\n((?: {2}- .+\n)+)---\n/u;

// One comma-separated string, which is how both tools spell a multi-glob. Empty where the rule carries no `paths:`
// list, which several do: `type-standards.md` and `testing.standard.md` govern any file, not a set of them.
export const globsOf = (source: string): string => {
  const listed = PATHS.exec(source)?.[1];

  return listed === undefined
    ? ''
    : listed.split('\n').flatMap((line) => {
        return /^ {2}- "(.+)"$/u.exec(line)?.[1] ?? [];
      }).join(',');
};

const withoutFrontmatter = (source: string): string => {
  return source.replace(PATHS, '').replace(/^\n+/u, '');
};

const named = (name: string, suffix: string): string => {
  return `${name.replace(/\.md$/u, '')}${suffix}`;
};

/**
 * Copilot reads one repository-wide file and any number of path-scoped ones, whose frontmatter key is `applyTo`.
 * Cursor reads `.mdc` rules alone, so the repository-wide half is a rule with `alwaysApply: true` rather than a file
 * of its own. Both are fed the same `fragments/claude-rules/` sources as the plugin skill
 * references, with the shared `paths:` list rewritten into the key that tool actually reads.
 */
export const ruleArtifacts = (
  answers: Answers,
  directory: string,
  suffix: string,
  frontmatter: (source: string) => string,
): Artifact[] => {
  return ruleSources(answers).map(({ name, sources }) => {
    return {
      stage: 'standard',
      target: `${directory}/${named(name, suffix)}`,
      content: {
        sources,
        transform: (source: string) => {
          return `${frontmatter(source)}${withoutFrontmatter(source)}`;
        },
      },
    };
  });
};
