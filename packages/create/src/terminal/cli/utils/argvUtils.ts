import { cwd as processCwd } from 'node:process';
import { parseArgs, type ParseArgsOptionsConfig } from 'node:util';

import { type AnswerKey, ANSWERS } from '../../../answers';
import { STAGES } from '../../../config/constants';
import { type Stage } from '../../../config/types';
import { valuesOf } from '../../../utils/objectUtils';

import type {
  AnswerRecord,
  ListRecord,
  MapRecord,
} from '../../../answers/record';
import type { JsonValue } from '../../../answers/utils/readUtils';

type FlaggableRecord = Exclude<AnswerRecord, ListRecord | MapRecord>;

interface FlagField {
  flag: string;
}

type FlaggedRecord = FlaggableRecord & FlagField;

// Answers given as flags, validated by the config parser so a wrong value names its choices.
export type AnswerFlags = Partial<Record<AnswerKey, JsonValue>>;

export interface CliOptions {
  command: 'create' | 'sync';
  name: string;
  cwd: string;
  // Present when any answer flag was passed; the run then asks nothing.
  answers?: AnswerFlags;
  skip: Stage[];
  // Kept rather than thrown on, so `main` reports every argv problem the same way.
  unknownSkips: string[];
  unexpectedArguments: string[];
  yes: boolean;
  fresh: boolean;
  force: boolean;
  help: boolean;
  version: boolean;
}

interface FlaggedAnswer {
  key: AnswerKey;
  record: FlaggableRecord;
  flag: string;
}

// `list` and `map` carry no `flag` on any of today's records, both being hand-edited only: `resolveConditions`,
// `aliases` and `ignores` are recorded, never passed on the command line.
const isFlaggable = (record: AnswerRecord): record is FlaggedRecord => {
  return record.flag !== undefined;
};

// Every record with a `flag`, in `ANSWERS`' own order, each already carrying the key that named it.
const FLAGGED_ANSWERS: readonly FlaggedAnswer[] = valuesOf(ANSWERS).flatMap((key): FlaggedAnswer[] => {
  const record: AnswerRecord = ANSWERS[key];

  return isFlaggable(record)
    ? [{
        key,
        record,
        flag: record.flag,
      }]
    : [];
});

const isMultiKind = (record: AnswerRecord): boolean => {
  return record.kind === 'multi' || record.kind === 'optionalMulti';
};

// `boolean` for the one boolean answer, `store`; `string`, `multiple` for the two kinds that ask for a list;
// `string` alone otherwise. Spread after the fixed entries, so a `--target` or a `--pm` is one more record away.
const ANSWER_OPTIONS = Object.fromEntries(FLAGGED_ANSWERS.map(({ flag, record }) => {
  return [flag, {
    type: record.kind === 'boolean' ? 'boolean' : 'string',
    ...(isMultiKind(record) ? { multiple: true } : {}),
  }];
}));

const labelOf = ({ flag, record }: FlaggedAnswer): string => {
  if (record.kind === 'boolean') {
    return `--${flag}`;
  }

  const shape = isMultiKind(record) ? 'list' : 'value';

  return `--${flag} <${shape}>`;
};

// Every answer line lines up on this column, `store` included, rather than each carrying its own two-space gap.
const LABEL_WIDTH = Math.max(...FLAGGED_ANSWERS.map((answer) => {
  return labelOf(answer).length;
}));

const noteOf = (record: AnswerRecord): string => {
  return record.note === undefined ? '' : ` (${record.note})`;
};

const answerUsageOf = (answer: FlaggedAnswer): string => {
  const { record } = answer;
  // `store` alone carries no `values` to list; its description is the one this cannot generate from the record.
  const description = record.kind === 'boolean'
    ? 'install the target\'s state store'
    : `${valuesOf(record.values).join(', ')}${noteOf(record)}`;

  return `  ${labelOf(answer).padEnd(LABEL_WIDTH)}  ${description}`;
};

export const USAGE = `@linteljs/create [name] [options]
@linteljs/create sync [options]

  --skip-scaffold   run stages 2-6 against an existing repository
  --no-install      skip the install and the eslint --fix pass that needs it
  --fresh           with --skip-scaffold, treat the directory as new scaffolder output
  --skip <stage>    skip a stage: scaffold, lint, package, standard, install, fix (repeatable)
  --yes, -y         accept the defaults, ask nothing
  --force           sync: overwrite without asking
  --version, -v
  --help, -h

Answers, for a run that asks nothing (unset ones take the defaults):
${FLAGGED_ANSWERS.map(answerUsageOf).join('\n')}
A list is comma-separated or the flag repeated.

A non-interactive create needs a project name, or --yes to take the directory's.
`;

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

const CLI_OPTIONS = {
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

  if (values['skip-scaffold'] && !skip.includes('scaffold')) {
    skip.push('scaffold');
  }

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
    yes: values.yes || answered,
    fresh: values.fresh,
    force: values.force,
    help: values.help,
    version: values.version,
  };
};
