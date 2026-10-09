import { basename } from 'node:path';

import {
  type Answers,
  type Data,
  type Mocking,
  type Router,
  type Workspace,
} from '@config/types';

import {
  hasLibrary,
  hasSurface,
  hasTests,
  localesOf,
  projectDirectoryOf,
} from '@utils/answerUtils';

import { targetFor } from '@targets';

export interface RuleSource {
  name: string;
  sources: string[];
}

export interface RuleGroup extends RuleSource {
  directories: string[];
  answers: Answers[];
}

type Condition
  = | 'store'
    | 'no-store'
    | 'languages'
    | 'popup'
    | 'background'
    | 'devtools-panel'
    | 'tailwind'
    | Mocking
    | Data
    | Router;

interface Run {
  name: Condition;
  fenced: boolean;
  lines: string[];
}

// A rule line ending in `<!-- when <condition> -->` names a folder only that answer writes.
const CONDITIONS: Record<Condition, (answers: Answers) => boolean> = {
  'store': (answers) => {
    return answers.store !== undefined;
  },
  'no-store': (answers) => {
    return answers.store === undefined;
  },
  'languages': (answers) => {
    return localesOf(answers).length > 0;
  },
  'popup': (answers) => {
    return hasSurface(answers, 'popup');
  },
  'background': (answers) => {
    return hasSurface(answers, 'background');
  },
  'devtools-panel': (answers) => {
    return hasSurface(answers, 'devtools-panel');
  },
  'tailwind': (answers) => {
    return answers.styling === 'tailwind';
  },
  'msw': (answers) => {
    return answers.mocking === 'msw';
  },
  'tanstack-query': (answers) => {
    return answers.data === 'tanstack-query';
  },
  'rtk-query': (answers) => {
    return answers.data === 'rtk-query';
  },
  'tanstack-router': (answers) => {
    return answers.router === 'tanstack-router';
  },
  'react-router': (answers) => {
    return answers.router === 'react-router';
  },
  'react-router-framework': (answers) => {
    return answers.router === 'react-router-framework';
  },
};

const WHEN = / <!-- when ([\w-]+) -->$/u;

const isCondition = (name: string): name is Condition => {
  return Object.hasOwn(CONDITIONS, name);
};

const conditionOf = (line: string): Condition | undefined => {
  const name = WHEN.exec(line)?.[1];

  if (name !== undefined && !isCondition(name)) {
    throw new Error(`Unknown rule condition: ${name}`);
  }

  return name;
};

// A shared copy keeps a run any of its projects writes, naming them when not all of them do.
const scoped = ({ fenced, lines }: Run, only: string[]): string[] => {
  const named = fenced
    ? only.join(', ')
    : only
        .map((directory) => {
          return `\`${directory}\``;
        })
        .join(', ');

  return lines
    .map((line, position) => {
      if (fenced) {
        return position === lines.length - 1 ? `${line}  (${named} only)` : line;
      }

      if (position > 0) {
        return line;
      }

      return line.startsWith('- ') ? `- ${named} only: ${line.slice(2)}` : `${named} only: ${line}`;
    });
};

export const forAnswers = (
  { answers, directories }: Pick<RuleGroup, 'answers' | 'directories'>,
  source: string,
): string => {
  const pieces: (string | Run)[] = [];
  let fenced = false;

  source
    .split('\n')
    .forEach((line) => {
      const name = conditionOf(line);
      const last = pieces.at(-1);

      if (name === undefined) {
        fenced = fenced !== line
          .trimStart()
          .startsWith('```');

        pieces.push(line);
      }
      else if (typeof last === 'object' && last.name === name) {
        last.lines.push(line
          .replace(WHEN, '')
          .trimEnd());
      }
      else {
        pieces.push({
          name,
          fenced,
          lines: [line
            .replace(WHEN, '')
            .trimEnd()],
        });
      }
    });

  return pieces
    .flatMap((piece) => {
      if (typeof piece === 'string') {
        const unconditional = [piece];

        return unconditional;
      }

      const only = answers
        .flatMap((projectAnswers, position) => {
          return CONDITIONS[piece.name](projectAnswers) ? directories.slice(position, position + 1) : [];
        });

      if (only.length === 0) {
        return [];
      }

      return only.length === directories.length ? piece.lines : scoped(piece, only);
    })
    .join('\n');
};

export const ruleSources = (answers: Answers): RuleSource[] => {
  const target = targetFor(answers);
  const rules: RuleSource[] = [
    {
      name: 'type-standards.md',
      sources: [
        'fragments/claude-rules/type-standards.md',
        ...(answers.typeSafety === 'relaxed' ? ['fragments/claude-rules/type-standards.relaxed.md'] : []),
      ],
    },
    {
      name: 'repo-structure.md',
      // The standard fragment is app-shaped: pages, components, an api layer.
      sources: target.packageProject === true
        ? ['fragments/claude-rules/repo-structure.package.md']
        : [
            `fragments/claude-rules/repo-structure.${target.id}.md`,
            'fragments/claude-rules/repo-structure.standard.md',
          ],
    },
    ...target.stateRules
      .map((rule) => {
        const ruleSource: RuleSource = {
          name: rule,
          sources: [`fragments/claude-rules/${rule}`],
        };

        return ruleSource;
      }),
  ];

  if (hasLibrary(answers, 'zod')) {
    rules.push({
      name: 'type-standards-zod.md',
      sources: ['fragments/claude-rules/type-standards-zod.md'],
    });
  }

  if (hasTests(answers)) {
    rules.push({
      name: 'testing.md',
      sources: [
        `fragments/claude-rules/testing.${target.id}.md`,
        'fragments/claude-rules/testing.standard.md',
      ],
    });
  }

  return rules;
};

export const labelOf = (answers: Answers): string => {
  return targetFor(answers).packageProject === true ? 'package' : answers.target;
};

export const ruleGroups = (workspace: Workspace): RuleGroup[] => {
  const groups = new Map<string, RuleGroup>();
  // A monorepo of one keeps the names it will have at two, so `sync --add` orphans no copy.
  const monorepo = workspace.projects[0].answers.layout === 'monorepo';

  workspace.projects
    .forEach(({ name: projectName, answers }) => {
      const directory = projectDirectoryOf(answers, projectName);

      ruleSources(answers)
        .forEach(({ name, sources }) => {
          // Their sources differ by framework, so a monorepo keeps one copy each.
          const framework = name === 'repo-structure.md' || name === 'testing.md';
          const key = monorepo && framework
            ? `${basename(name, '.md')}.${labelOf(answers)}.md`
            : name;
          const group = groups.get(key) ?? {
            name: key,
            sources,
            directories: [],
            answers: [],
          };

          group.directories.push(directory);
          group.answers.push(answers);
          groups.set(key, group);
        });
    });

  const grouped = [...groups.values()];

  return grouped;
};
