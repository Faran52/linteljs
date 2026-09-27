import { type ParseArgsOptionsConfig } from 'node:util';

import { STAGES } from '@config/constants';
import { type Stage } from '@config/types';

import {
  answerOptions,
  answerUsage,
  flaggedAnswers,
  widthOf,
} from './utils/flagUtils';

export const FLAGGED_ANSWERS = flaggedAnswers();

const ANSWER_OPTIONS = answerOptions(FLAGGED_ANSWERS);

export const USAGE = `@linteljs/create [name] [options]
@linteljs/create sync [options]

  --existing        run in this directory, which already exists, rather than making <name>/
  --no-install      skip the install and the eslint --fix pass that needs it
  --seed            with --existing, plant the starter and seed files a new project is born with
  --skip <stage>    skip a stage: lint, package, standard, install, fix (repeatable)
  --yes, -y         accept the defaults, ask nothing
  --force           sync: overwrite without asking
  --version, -v
  --help, -h

Answers, for a run that asks nothing (unset ones take the defaults):
${answerUsage(FLAGGED_ANSWERS)}
A list is comma-separated or the flag repeated.

A non-interactive create needs a project name, or --yes to take the directory's.
`;

export const CLI_OPTIONS = {
  'existing': {
    type: 'boolean',
    default: false,
  },
  'no-install': {
    type: 'boolean',
    default: false,
  },
  'seed': {
    type: 'boolean',
    default: false,
  },
  'skip': {
    type: 'string',
    multiple: true,
    default: [],
  },
  'yes': {
    type: 'boolean',
    short: 'y',
    default: false,
  },
  'force': {
    type: 'boolean',
    default: false,
  },
  'help': {
    type: 'boolean',
    short: 'h',
    default: false,
  },
  'version': {
    type: 'boolean',
    short: 'v',
    default: false,
  },
  ...ANSWER_OPTIONS,
} satisfies ParseArgsOptionsConfig;

export const STAGE_LABELS: Record<Stage, string> = {
  lint: 'lint: eslint and stylelint config',
  package: 'package: package.json, tsconfig and the manager files',
  standard: 'standard: hooks, agent files, test setup and starter tests',
  install: 'install',
  fix: 'fix: eslint and stylelint --fix',
};

// Braille, so one cell turns rather than a word growing.
export const SPINNER_FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

// Slow enough to read a stage's name, fast enough to look alive.
export const SPINNER_INTERVAL = 80;

export const STAGE_WIDTH = widthOf(STAGES);
