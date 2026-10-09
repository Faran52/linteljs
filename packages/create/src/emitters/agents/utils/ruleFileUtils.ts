import { basename } from 'node:path';

import { type Artifact, type Workspace } from '@config/types';

import { withoutClaudePaths } from '../../utils/frontmatterUtils';

import { forAnswers, ruleGroups } from './ruleGroupUtils';

const PATHS = /^---\npaths:\n((?: {2}- .+\n)+)---\n/u;

// Both tools split a multi-glob on commas, so a brace group's own comma would cut a glob in half.
const expanded = (glob: string): string[] => {
  const group = /\{([^{}]+)\}/u.exec(glob);

  const globs: string[] = group?.[1] === undefined
    ? [glob]
    : group[1]
        .split(',')
        .flatMap((alternative) => {
          // A function, so a `$` in the alternative is never read as a replacement pattern.
          const spelled = glob
            .replace(group[0], () => {
              return alternative;
            });

          return expanded(spelled);
        });

  return globs;
};

// The tools read from the git root, where `.` is a single layout's one project.
const rooted = (glob: string, directory: string): string => {
  return directory === '.' ? glob : `${directory}/${glob}`;
};

// Empty where the rule carries no `paths:` list.
export const globsOf = (source: string, directories: readonly string[]): string => {
  const listed = PATHS.exec(source)?.[1];

  return listed === undefined
    ? ''
    : listed
        .split('\n')
        .flatMap((line) => {
          // `PATHS` has already held every line to `  - "..."`.
          return /"(.+)"/u.exec(line)?.[1] ?? [];
        })
        .flatMap(expanded)
        .flatMap((glob) => {
          return directories
            .map((directory) => {
              return rooted(glob, directory);
            });
        })
        .join(',');
};

const named = (name: string, suffix: string): string => {
  return `${basename(name, '.md')}${suffix}`;
};

// Cursor reads `.mdc` rules alone, so the repository-wide half is an `alwaysApply: true` rule.
export const ruleArtifacts = (
  workspace: Workspace,
  directory: string,
  suffix: string,
  frontmatter: (source: string, globs: string) => string,
): Artifact[] => {
  return ruleGroups(workspace)
    .map(({
      name,
      sources,
      directories,
      answers,
    }) => {
      const artifact: Artifact = {
        stage: 'standard',
        target: `${directory}/${named(name, suffix)}`,
        content: {
          sources,
          transform: (source: string) => {
            const header = frontmatter(source, globsOf(source, directories));
            const body = withoutClaudePaths(forAnswers(answers, source));

            return `${header}${body}`;
          },
        },
      };

      return artifact;
    });
};
