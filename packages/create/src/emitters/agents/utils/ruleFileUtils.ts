import { type Answers, type Artifact } from '@config/types';

import { ruleSources } from '../../always/linteljs-plugin/linteljsPluginEmitter';

const PATHS = /^---\npaths:\n((?: {2}- .+\n)+)---\n/u;

// Empty where the rule carries no `paths:` list.
export const globsOf = (source: string): string => {
  const listed = PATHS.exec(source)?.[1];

  return listed === undefined
    ? ''
    : listed
        .split('\n')
        .flatMap((line) => {
        // `PATHS` has already held every line to `  - "..."`.
          return /"(.+)"/u.exec(line)?.[1] ?? [];
        })
        .join(',');
};

const withoutFrontmatter = (source: string): string => {
  return source
    .replace(PATHS, '')
    .replace(/^\n+/u, '');
};

const named = (name: string, suffix: string): string => {
  return `${name.replace(/\.md$/u, '')}${suffix}`;
};

// Cursor reads `.mdc` rules alone, so the repository-wide half is an `alwaysApply: true` rule.
export const ruleArtifacts = (
  answers: Answers,
  directory: string,
  suffix: string,
  frontmatter: (source: string) => string,
): Artifact[] => {
  return ruleSources(answers)
    .map(({ name, sources }) => {
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
