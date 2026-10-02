import { basename } from 'node:path';

import { type Answers, type Artifact } from '@config/types';

import { forAnswers, ruleSources } from '../../always/linteljs-plugin/linteljsPluginEmitter';

const PATHS = /^---\npaths:\n((?: {2}- .+\n)+)---\n/u;

// Both tools split a multi-glob on commas, so a brace group's own comma would cut a glob in half.
const expanded = (glob: string): string[] => {
  const group = /\{([^{}]+)\}/u.exec(glob);

  const globs: string[] = group?.[1] === undefined
    ? [glob]
    : group[1]
        .split(',')
        .flatMap((alternative) => {
          return expanded(`${glob.slice(0, group.index)}${alternative}${glob.slice(group.index + group[0].length)}`);
        });

  return globs;
};

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
        .flatMap(expanded)
        .join(',');
};

const withoutFrontmatter = (source: string): string => {
  return source
    .replace(PATHS, '')
    .replace(/^\n+/u, '');
};

const named = (name: string, suffix: string): string => {
  return `${basename(name, '.md')}${suffix}`;
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
      const artifact: Artifact = {
        stage: 'standard',
        target: `${directory}/${named(name, suffix)}`,
        content: {
          sources,
          transform: (source: string) => {
            const header = frontmatter(source);
            const body = withoutFrontmatter(forAnswers(answers, source));

            return `${header}${body}`;
          },
        },
      };

      return artifact;
    });
};
