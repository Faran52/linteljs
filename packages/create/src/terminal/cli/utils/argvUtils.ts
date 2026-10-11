import { cwd as processCwd } from 'node:process';
import { parseArgs } from 'node:util';

import { STAGES } from '@config/constants';
import { type Stage } from '@config/types';

import {
  type AnswerKey,
  isWorkspaceKey,
  type JsonValue,
} from '@answers';

import { PROJECT_DIR_NAME_RULE, PROJECT_NAME_RULE } from '../../constants';
import { isValidProjectDirName, isValidProjectName } from '../../utils/nameUtils';
import {
  ADD_NEEDS_SYNC,
  CLI_OPTIONS,
  EXISTING_MONOREPO,
  PACKAGE_NAME_RULE,
  PROJECT_NEEDS_MONOREPO,
} from '../constants';

import {
  answerOptions,
  type FlaggedAnswer,
  flaggedAnswers,
} from './flagUtils';

// Validated by the config parser, so a wrong value names its choices.
export type AnswerFlags = Partial<Record<AnswerKey, JsonValue>>;

export interface ProjectFlags {
  name: string;
  kind?: string;
  answers: AnswerFlags;
}

export interface CliOptions {
  command: 'create' | 'sync';
  name: string;
  cwd: string;
  // With `projects`, the workspace answers alone.
  answers?: AnswerFlags;
  projects?: [ProjectFlags, ...ProjectFlags[]];
  // Per-project flags given before the first `--project`.
  strayFlags: string[];
  skip: Stage[];
  existing: boolean;
  // `sync --add <name> [--kind app|package]`: the project to write.
  add?: string;
  kind?: string;
  // Kept rather than thrown on, so `main` reports every argv problem the same way.
  unknownSkips: string[];
  unexpectedArguments: string[];
  yes: boolean;
  seed: boolean;
  help: boolean;
  version: boolean;
}

interface ProjectGroup {
  name: string;
  kind?: string;
  values: Record<string, string | string[]>;
}

interface ProjectGroups {
  groups: ProjectGroup[];
  strays: string[];
}

type ArgToken = NonNullable<ReturnType<typeof parseArgs>['tokens']>[number];

// An empty value is how a flag says none, and `''.split(',')` would answer `['']`.
const list = (flag: string[]): string[] => {
  return flag
    .flatMap((value) => {
      return value.split(',');
    })
    .filter((item) => {
      return item !== '';
    });
};

// `answerOptions` declares list flags `multiple`, so an array is a list to comma-split.
const answerFlagsFrom = (flagged: readonly FlaggedAnswer[], values: Record<string, boolean
  | string
  | string[]
  | undefined>): AnswerFlags => {
  const flags: AnswerFlags = {};

  for (const { key, flag } of flagged) {
    const value = values[flag];

    if (value !== undefined) {
      flags[key] = Array.isArray(value) ? list(value) : value;
    }
  }

  return flags;
};

// `parseArgs` keeps no order, so the tokens are walked: each `--project` opens a group the per-project flags join.
const projectGroupsOf = (tokens: readonly ArgToken[], perProject: readonly FlaggedAnswer[]): ProjectGroups => {
  const declared = Object.entries(answerOptions(perProject));
  const flags = new Set([
    'project',
    'kind',
    ...declared
      .map(([flag]) => {
        return flag;
      }),
  ]);
  const multiple = new Set(declared
    .filter(([, option]) => {
      return option.multiple === true;
    })
    .map(([flag]) => {
      return flag;
    }));
  const groups: ProjectGroup[] = [];
  const strays: string[] = [];

  for (const token of tokens) {
    if (token.kind !== 'option' || !flags.has(token.name)) {
      continue;
    }

    const value = String(token.value);
    const group = groups.at(-1);

    if (token.name === 'project') {
      groups.push({
        name: value,
        values: {},
      });
    }
    else if (group === undefined) {
      strays.push(`--${token.name}`);
    }
    else if (token.name === 'kind') {
      group.kind = value;
    }
    else {
      const previous = group.values[token.name];
      const listed = Array.isArray(previous) ? previous : [];

      group.values[token.name] = multiple.has(token.name) ? [...listed, value] : value;
    }
  }

  const grouped: ProjectGroups = {
    groups,
    strays,
  };

  return grouped;
};

const projectFlagsOf = (group: ProjectGroup, perProject: readonly FlaggedAnswer[]): ProjectFlags => {
  const project: ProjectFlags = {
    name: group.name,
    ...(group.kind === undefined ? {} : { kind: group.kind }),
    answers: answerFlagsFrom(perProject, group.values),
  };

  return project;
};

const isStage = (value: string): value is Stage => {
  return STAGES
    .some((stage) => {
      return stage === value;
    });
};

export const parseCliArgs = (argv: string[]): CliOptions => {
  const answers = flaggedAnswers();
  const declared = {
    ...CLI_OPTIONS,
    ...answerOptions(answers),
  };
  const {
    values,
    positionals,
    tokens,
  } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: declared,
    tokens: true,
  });

  const perProject = answers
    .filter(({ key }) => {
      return !isWorkspaceKey(key);
    });
  const { groups, strays } = projectGroupsOf(tokens, perProject);
  const [firstGroup, ...otherGroups] = groups;
  const hasProjects = firstGroup !== undefined;
  const workspaceFlags = answerFlagsFrom(answers
    .filter(({ key }) => {
      return isWorkspaceKey(key);
    }), values);
  const flagged = hasProjects
    ? {
        layout: 'monorepo',
        ...workspaceFlags,
      }
    : answerFlagsFrom(answers, values);
  const answered = Object.keys(flagged).length > 0;

  const [first = '', ...unexpectedArguments] = positionals;
  const command = first === 'sync' ? 'sync' : 'create';
  const skip: Stage[] = values.skip.filter(isStage);
  const unknownSkips = values.skip
    .filter((value) => {
      return !isStage(value);
    });

  // `parseArgs` has no `--no-` negation, so the flag is declared under its literal name.
  if (values['no-install']) {
    skip.push('install', 'fix');
  }

  const options: CliOptions = {
    command,
    name: command === 'sync' ? '' : first,
    cwd: processCwd(),
    skip,
    unknownSkips,
    unexpectedArguments,
    ...(answered ? { answers: flagged } : {}),
    ...(firstGroup === undefined
      ? {}
      : {
          projects: [projectFlagsOf(firstGroup, perProject), ...otherGroups
            .map((group) => {
              return projectFlagsOf(group, perProject);
            })],
        }),
    strayFlags: hasProjects ? strays : [],
    ...(values.add === undefined ? {} : { add: values.add }),
    ...(values.kind === undefined || hasProjects ? {} : { kind: values.kind }),
    existing: values.existing,
    // On `sync` an answer flag answers nothing, so it must not stand in for the confirmation.
    yes: values.yes || (answered && command === 'create'),
    seed: values.seed,
    help: values.help,
    version: values.version,
  };

  return options;
};

// A directory name was never chosen as a package name; adopting one is what `--existing` is for.
const projectNameError = (options: CliOptions): string | undefined => {
  // `sync` takes no name, so this one check covers both.
  if (options.name === '') {
    return undefined;
  }

  return isValidProjectName(options.name) ? undefined : `Project name must be ${PROJECT_NAME_RULE}.`;
};

const projectError = (project: ProjectFlags, workspaceName: string, taken: readonly string[]): string | undefined => {
  const { name, kind } = project;

  if (!isValidProjectDirName(name, workspaceName, taken)) {
    return `Project name ${name} must be ${PROJECT_DIR_NAME_RULE}.`;
  }

  if (kind !== undefined && kind !== 'app' && kind !== 'package') {
    return `--kind takes app or package, not ${kind}.`;
  }

  if (kind === 'package' && Object.keys(project.answers).length > 0) {
    return `${name} is a package, a TypeScript package on its defaults, so it takes no answer flags.`;
  }

  if (kind !== 'package' && project.answers.target === 'typescript') {
    return `${name} is an app, which needs a framework; a TypeScript package is --kind package.`;
  }

  return undefined;
};

// The name becomes a path under apps/ or packages/, so nothing that could leave it gets that far.
const addError = (options: CliOptions): string | undefined => {
  if (options.add === undefined) {
    return undefined;
  }

  if (options.command !== 'sync') {
    return ADD_NEEDS_SYNC;
  }

  const isPackageName = isValidProjectName(options.add) && !options.add.startsWith('@');

  if (!isPackageName) {
    return `Package name must be ${PACKAGE_NAME_RULE}.`;
  }

  const added: ProjectFlags = {
    name: options.add,
    kind: options.kind ?? 'package',
    answers: options.answers ?? {},
  };

  return projectError(added, '', []);
};

const projectsError = (options: CliOptions): string | undefined => {
  const { projects = [], strayFlags } = options;

  if (strayFlags.length > 0) {
    return `${strayFlags.join(', ')} before the first --project: a project's flags follow its --project.`;
  }

  if (projects.length > 0 && options.answers?.layout !== 'monorepo') {
    return PROJECT_NEEDS_MONOREPO;
  }

  const names = projects
    .map(({ name }) => {
      return name;
    });

  return projects
    .map((project, index) => {
      const taken = names.slice(0, index);

      return projectError(project, options.name, taken);
    })
    .find((error) => {
      return error !== undefined;
    });
};

export const argumentError = (options: CliOptions): string | undefined => {
  if (options.unexpectedArguments.length > 0) {
    const plural = options.unexpectedArguments.length === 1 ? '' : 's';

    return `Unexpected argument${plural}: ${options.unexpectedArguments.join(', ')}`;
  }

  if (options.unknownSkips.length > 0) {
    return `Not a stage: ${options.unknownSkips.join(', ')}. Pass one of: ${STAGES.join(', ')}.`;
  }

  if (options.existing && options.answers?.layout === 'monorepo') {
    return EXISTING_MONOREPO;
  }

  return projectsError(options) ?? addError(options) ?? projectNameError(options);
};
