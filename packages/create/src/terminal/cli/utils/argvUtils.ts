import { cwd as processCwd } from 'node:process';
import { parseArgs } from 'node:util';

import { STAGES } from '@config/constants';
import { type Stage } from '@config/types';

import { type AnswerKey, type JsonValue } from '@answers';

import { PROJECT_NAME_RULE } from '../../constants';
import { isValidProjectName } from '../../utils/nameUtils';
import { CLI_OPTIONS, EXISTING_MONOREPO } from '../constants';

import {
  answerOptions,
  type FlaggedAnswer,
  flaggedAnswers,
} from './flagUtils';

// Validated by the config parser, so a wrong value names its choices.
export type AnswerFlags = Partial<Record<AnswerKey, JsonValue>>;

export interface CliOptions {
  command: 'create' | 'sync';
  name: string;
  cwd: string;
  answers?: AnswerFlags;
  skip: Stage[];
  existing: boolean;
  // Kept rather than thrown on, so `main` reports every argv problem the same way.
  unknownSkips: string[];
  unexpectedArguments: string[];
  yes: boolean;
  seed: boolean;
  help: boolean;
  version: boolean;
}

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
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: declared,
  });

  const flagged = answerFlagsFrom(answers, values);
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

  return projectNameError(options);
};
