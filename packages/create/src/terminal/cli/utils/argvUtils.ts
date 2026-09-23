import { cwd as processCwd } from 'node:process';
import { parseArgs } from 'node:util';

import { STAGES } from '@config/constants';
import { type Stage } from '@config/types';

import { type AnswerKey } from '@answers';

import {
  CLI_OPTIONS,
  FLAGGED_ANSWERS,
  isMultiKind,
} from '../constants';

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
  // `--skip-scaffold`: the directory is a repository that already exists rather than one this run makes.
  existing: boolean;
  // Kept rather than thrown on, so `main` reports every argv problem the same way.
  unknownSkips: string[];
  unexpectedArguments: string[];
  yes: boolean;
  fresh: boolean;
  force: boolean;
  help: boolean;
  version: boolean;
}

const list = (flag: string[]): string[] => {
  return flag.flatMap((value) => {
    return value.split(',');
  });
};

// `values[record.flag]` to `{ [record.key]: ... }`: a multi-kind flag is comma-split, a boolean flag is dropped
// unless it was actually passed, and everything else passes through for the config parser to validate.
const answerFlagsFrom = (values: Record<string, JsonValue | undefined>): AnswerFlags => {
  const flags: AnswerFlags = {};

  for (const {
    key,
    record,
    flag,
  } of FLAGGED_ANSWERS) {
    const value = values[flag];

    if (value === undefined || value === false) {
      continue;
    }

    flags[key] = isMultiKind(record) && Array.isArray(value)
      ? list(value.filter((item): item is string => {
          return typeof item === 'string';
        }))
      : value;
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
    existing: values['skip-scaffold'],
    yes: values.yes || answered,
    fresh: values.fresh,
    force: values.force,
    help: values.help,
    version: values.version,
  };
};
