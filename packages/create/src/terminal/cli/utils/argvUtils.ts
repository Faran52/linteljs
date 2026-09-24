import { cwd as processCwd } from 'node:process';
import { parseArgs } from 'node:util';

import { STAGES } from '@config/constants';
import { type Stage } from '@config/types';

import { type AnswerKey } from '@answers';

import { PROJECT_NAME_RULE } from '../../constants';
import { isValidProjectName } from '../../utils/nameUtils';
import { CLI_OPTIONS, FLAGGED_ANSWERS } from '../constants';

import type { JsonValue } from '@answers/utils/readUtils';

// Answers given as flags, validated by the config parser so a wrong value names its choices.
export type AnswerFlags = Partial<Record<AnswerKey, JsonValue>>;

export interface CliOptions {
  command: 'create' | 'sync';
  name: string;
  cwd: string;
  // Present when any answer flag was passed; the run then asks nothing.
  answers?: AnswerFlags;
  skip: Stage[];
  // `--existing`: the directory is a repository that already exists rather than one this run makes.
  existing: boolean;
  // Kept rather than thrown on, so `main` reports every argv problem the same way.
  unknownSkips: string[];
  unexpectedArguments: string[];
  yes: boolean;
  // `--seed`: plant the seed artifacts in that directory as if this run had made it.
  seed: boolean;
  force: boolean;
  help: boolean;
  version: boolean;
}

const list = (flag: string[]): string[] => {
  return flag.flatMap((value) => {
    return value.split(',');
  });
};

// `values[record.flag]` to `{ [record.key]: ... }`. `CLI_OPTIONS` declares every answer flag a string and a list one
// `multiple`, so an array is a list to comma-split and anything else passes through for the config parser to validate.
const answerFlagsFrom = (values: Record<string, boolean
  | string
  | string[]
  | undefined>): AnswerFlags => {
  const flags: AnswerFlags = {};

  for (const { key, flag } of FLAGGED_ANSWERS) {
    const value = values[flag];

    if (value !== undefined) {
      flags[key] = Array.isArray(value) ? list(value) : value;
    }
  }

  return flags;
};

const isStage = (value: string): value is Stage => {
  return STAGES.some((stage) => {
    return stage === value;
  });
};

export const parseCliArgs = (argv: string[]): CliOptions => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: CLI_OPTIONS,
  });

  const flagged = answerFlagsFrom(values);
  const answered = Object.keys(flagged).length > 0;

  const [first = '', ...unexpectedArguments] = positionals;
  const command = first === 'sync' ? 'sync' : 'create';
  const skip: Stage[] = values.skip.filter(isStage);
  const unknownSkips = values.skip.filter((value) => {
    return !isStage(value);
  });

  // `parseArgs` has no `--no-` negation, so the flag is declared under its literal name.
  if (values['no-install']) {
    skip.push('install', 'fix');
  }

  return {
    command,
    name: command === 'sync' ? '' : first,
    cwd: processCwd(),
    skip,
    unknownSkips,
    unexpectedArguments,
    ...(answered ? { answers: flagged } : {}),
    // An answer flag makes the run non-interactive the way --yes does; the rest take the defaults.
    existing: values.existing,
    yes: values.yes || answered,
    seed: values.seed,
    force: values.force,
    help: values.help,
    version: values.version,
  };
};

// The argument only: a directory name was never chosen as a package name, and adopting one is what
// `--existing` is for.
const projectNameError = (options: CliOptions): string | undefined => {
  // `sync` takes no name, so `parseCliArgs` gives it `''` and this one check covers both.
  if (options.name === '') {
    return undefined;
  }

  return isValidProjectName(options.name) ? undefined : `Project name must be ${PROJECT_NAME_RULE}.`;
};

// Every refusal of the argv, in the order a user meets them.
export const argumentError = (options: CliOptions): string | undefined => {
  if (options.unexpectedArguments.length > 0) {
    const plural = options.unexpectedArguments.length === 1 ? '' : 's';

    return `Unexpected argument${plural}: ${options.unexpectedArguments.join(', ')}`;
  }

  if (options.unknownSkips.length > 0) {
    return `Not a stage: ${options.unknownSkips.join(', ')}. Pass one of: ${STAGES.join(', ')}.`;
  }

  return projectNameError(options);
};
