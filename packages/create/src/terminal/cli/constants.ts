import { type ParseArgsOptionsConfig } from 'node:util';

import { STAGES } from '@config/constants';
import { type Stage } from '@config/types';

import { valuesOf } from '@utils/objectUtils';

import {
  type AnswerKey,
  ANSWERS,
  type PackageManager,
} from '@answers';

import type {
  AnswerRecord,
  ListRecord,
  MapRecord,
  TextRecord,
} from '@answers/types';

type FlaggableRecord = Exclude<AnswerRecord, ListRecord | MapRecord | TextRecord>;

interface FlagField {
  flag: string;
}

type FlaggedRecord = FlaggableRecord & FlagField;

interface FlaggedAnswer {
  key: AnswerKey;
  record: FlaggableRecord;
  flag: string;
}

// Nothing under `recorded/` carries a `flag`: `resolveConditions`, `aliases` and `ignores` are hand-edited, and the
// manager and the two versions are read off the machine that ran this, never passed on the command line.
const isFlaggable = (record: AnswerRecord): record is FlaggedRecord => {
  return record.flag !== undefined;
};

// Every record with a `flag`, in `ANSWERS`' own order, each already carrying the key that named it.
export const FLAGGED_ANSWERS: readonly FlaggedAnswer[] = valuesOf(ANSWERS).flatMap((key): FlaggedAnswer[] => {
  const record: AnswerRecord = ANSWERS[key];

  return isFlaggable(record)
    ? [{
        key,
        record,
        flag: record.flag,
      }]
    : [];
});

export const isMultiKind = (record: AnswerRecord): boolean => {
  return record.kind === 'multi' || record.kind === 'optionalMulti';
};

// `string`, `multiple` for the two kinds that ask for a list, `string` alone otherwise. Spread after the fixed
// entries, so a `--target` or a `--store` is one record away.
const ANSWER_OPTIONS = Object.fromEntries(FLAGGED_ANSWERS.map(({ flag, record }) => {
  return [flag, {
    type: 'string',
    ...(isMultiKind(record) ? { multiple: true } : {}),
  }];
}));

const labelOf = ({ flag, record }: FlaggedAnswer): string => {
  const shape = isMultiKind(record) ? 'list' : 'value';

  return `--${flag} <${shape}>`;
};

// Every answer line lines up on this column rather than each carrying its own two-space gap.
const LABEL_WIDTH = Math.max(...FLAGGED_ANSWERS.map((answer) => {
  return labelOf(answer).length;
}));

const noteOf = (record: AnswerRecord): string => {
  return record.note === undefined ? '' : ` (${record.note})`;
};

const answerUsageOf = (answer: FlaggedAnswer): string => {
  const { record } = answer;

  return `  ${labelOf(answer).padEnd(LABEL_WIDTH)}  ${valuesOf(record.values).join(', ')}${noteOf(record)}`;
};

export const USAGE = `@linteljs/create [name] [options]
@linteljs/create sync [options]

  --skip-scaffold   run against a directory that already exists
  --no-install      skip the install and the eslint --fix pass that needs it
  --fresh           with --skip-scaffold, plant the seed files a new project is born with
  --skip <stage>    skip a stage: lint, package, standard, install, fix (repeatable)
  --yes, -y         accept the defaults, ask nothing
  --force           sync: overwrite without asking
  --version, -v
  --help, -h

Answers, for a run that asks nothing (unset ones take the defaults):
${FLAGGED_ANSWERS.map(answerUsageOf).join('\n')}
A list is comma-separated or the flag repeated.

A non-interactive create needs a project name, or --yes to take the directory's.
`;

export const CLI_OPTIONS = {
  'skip-scaffold': {
    type: 'boolean',
    default: false,
  },
  'no-install': {
    type: 'boolean',
    default: false,
  },
  'fresh': {
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

/**
 * What each stage does, on the line that announces it.
 * The lockfile a directory already has, for a run with no user agent: `--skip-scaffold` and `sync` on a project
 * that carries one. In the order `package-manager-detector` checks them.
 */
export const LOCKFILES: readonly (readonly [string, PackageManager])[] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
];

export const STAGE_LABELS: Record<Stage, string> = {
  lint: 'lint: eslint and stylelint config',
  package: 'package: package.json, tsconfig and the manager files',
  standard: 'standard: hooks, agent files, test setup and starter tests',
  install: 'install',
  fix: 'fix: eslint and stylelint --fix',
};

// Braille, so one cell turns rather than a word growing. Every terminal this CLI refuses to run below draws them.
export const SPINNER_FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

// Slow enough to read a stage's name, fast enough to look alive.
export const SPINNER_INTERVAL = 80;

// Every stage summary lines up on one column, so a run reads down rather than ragged.
export const STAGE_WIDTH = Math.max(...STAGES.map((stage) => {
  return stage.length;
}));
