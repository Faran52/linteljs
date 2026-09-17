import { type Artifact, emitted } from '../artifact/artifact';
import { ruleSources } from '../lintel-plugin/referenceArtifacts';

import { emitAgentAdapter } from './emitAgentAdapter';

import type { Answers } from '../../model/answers/answers';

const PATHS = /^---\npaths:\n((?: {2}- .+\n)+)---\n/u;

// One comma-separated string, which is how both tools spell a multi-glob. Empty where the rule carries no `paths:`
// list, which several do: `type-standards.md` and `testing.standard.md` govern any file, not a set of them.
const globsOf = (source: string): string => {
  const listed = PATHS.exec(source)?.[1];

  return listed === undefined
    ? ''
    : listed.split('\n').flatMap((line) => {
        return /^ {2}- "(.+)"$/u.exec(line)?.[1] ?? [];
      }).join(',');
};

// The rule's own first heading, so neither tool needs a second description to drift from it.
const titleOf = (source: string): string => {
  return /^# (.+)$/mu.exec(source)?.[1] ?? 'LintelJS project standard';
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
 * of its own. Both are fed the same `claude-rules/` sources as the plugin skill references, with the shared `paths:`
 * list rewritten into the key that tool actually reads.
 */
const ruleArtifacts = (
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

export const copilotArtifacts = (answers: Answers): Artifact[] => {
  return [
    {
      ...emitted('standard', '.github/copilot-instructions.md', emitAgentAdapter(answers)),
      preserve: true,
    },
    // `**` where the rule lists no paths: it governs any file, which is what Copilot reads that glob as.
    ...ruleArtifacts(answers, '.github/instructions', '.instructions.md', (source) => {
      const globs = globsOf(source);

      return `---\napplyTo: "${globs === '' ? '**' : globs}"\n---\n\n`;
    }),
  ];
};

export const cursorArtifacts = (answers: Answers): Artifact[] => {
  return [
    {
      ...emitted(
        'standard',
        '.cursor/rules/linteljs.mdc',
        `---\ndescription: LintelJS project\nalwaysApply: true\n---\n\n${emitAgentAdapter(answers)}`,
      ),
      preserve: true,
    },
    // A rule listing no paths governs any file, and Cursor spells that `alwaysApply` rather than with a glob, so the
    // two keys move together: globs and not always, or always and no globs.
    ...ruleArtifacts(answers, '.cursor/rules', '.mdc', (source) => {
      const globs = globsOf(source);
      const scope = globs === '' ? 'alwaysApply: true' : `globs: ${globs}\nalwaysApply: false`;

      return `---\ndescription: ${titleOf(source)}\n${scope}\n---\n\n`;
    }),
  ];
};
