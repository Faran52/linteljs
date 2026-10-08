import { basename } from 'node:path';

import {
  type Answers,
  type Data,
  type Mocking,
  type Router,
  type Workspace,
  type WorkspaceProject,
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

// A group's copy keeps a line any of its projects writes; `no-store` is the one negative, so it needs all.
const holds = (name: Condition, answers: readonly Answers[]): boolean => {
  return name === 'no-store' ? answers.every(CONDITIONS[name]) : answers.some(CONDITIONS[name]);
};

export const forAnswers = (answers: readonly Answers[], source: string): string => {
  return source
    .split('\n')
    .flatMap((line) => {
      const name = WHEN.exec(line)?.[1];

      if (name === undefined) {
        const unconditional = [line];

        return unconditional;
      }

      if (!isCondition(name)) {
        throw new Error(`Unknown rule condition: ${name}`);
      }

      if (!holds(name, answers)) {
        return [];
      }

      const stripped = [line
        .replace(WHEN, '')
        .trimEnd()];

      return stripped;
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

// `.` leaves a glob as written, `**` finds a lone project wherever it sits.
const directoryOf = ({ name, answers }: WorkspaceProject, several: boolean): string => {
  if (several) {
    return projectDirectoryOf(answers, name);
  }

  return answers.layout === 'monorepo' ? '**' : '.';
};

const labelOf = (answers: Answers): string => {
  return targetFor(answers).packageProject === true ? 'package' : answers.target;
};

export const ruleGroups = (workspace: Workspace): RuleGroup[] => {
  const groups = new Map<string, RuleGroup>();
  const several = workspace.projects.length > 1;

  workspace.projects
    .forEach((project) => {
      const directory = directoryOf(project, several);

      ruleSources(project.answers)
        .forEach(({ name, sources }) => {
          // Their sources differ by framework, so a workspace of several keeps one copy each.
          const framework = name === 'repo-structure.md' || name === 'testing.md';
          const key = several && framework
            ? `${basename(name, '.md')}.${labelOf(project.answers)}.md`
            : name;
          const group = groups.get(key) ?? {
            name: key,
            sources,
            directories: [],
            answers: [],
          };

          group.directories.push(directory);
          group.answers.push(project.answers);
          groups.set(key, group);
        });
    });

  const grouped = [...groups.values()];

  return grouped;
};
