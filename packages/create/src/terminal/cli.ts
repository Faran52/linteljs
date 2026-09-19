import {
  basename,
  join,
  resolve,
} from 'node:path';
import {
  cwd as processCwd,
  stdin,
  stdout,
  versions,
} from 'node:process';
import { parseArgs, type ParseArgsOptionsConfig } from 'node:util';

import packageJson from '../../package.json' with { type: 'json' };
import {
  type AnswerKey,
  ANSWERS,
  type Answers,
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  parseLinteljsConfig,
} from '../answers';
import { valuesOf } from '../answers/record';
import { RUN_PREFIX, STAGES } from '../config/constants';
import { type Stage } from '../config/types';
import { readLinteljsConfig } from '../files/readLinteljsConfig';
import { entryExists } from '../files/utils/fsUtils';
import { runPipeline } from '../pipeline/pipeline';
import { applySync, planSync } from '../pipeline/sync';
import { ensurePackageManager, nodeVersionRefusal } from '../process/packageManager';

import {
  ask,
  type Asked,
  clackPrompter,
  NOTHING_ANSWERED_MESSAGE,
  type Prompter,
} from './prompts';
import { isValidProjectName, PROJECT_NAME_RULE } from './utils/nameUtils';

import type {
  AnswerRecord,
  ListRecord,
  MapRecord,
} from '../answers/record';
import type { JsonValue } from '../answers/utils/readUtils';

// `list` and `map` carry no `flag` on any of today's records, both being hand-edited only: `resolveConditions`,
// `aliases` and `ignores` are recorded, never passed on the command line.
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

// stdout for what the user asked to see; `console.error` for failures.
const say = (message: string): void => {
  stdout.write(`${message}\n`);
};

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

const USAGE = `@linteljs/create [name] [options]
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

// Through the config parser rather than a second validator: every flag gets the same message a bad config does.
const flaggedAnswers = (flags: AnswerFlags = {}): Answers => {
  return parseLinteljsConfig(JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...DEFAULT_ANSWERS,
    ...flags,
  }));
};

// What each stage does, on the line that announces it.
const STAGE_LABELS: Record<Stage, string> = {
  scaffold: 'scaffold: the official generator',
  lint: 'lint: eslint and stylelint config',
  package: 'package: package.json, tsconfig and the manager files',
  standard: 'standard: hooks, agent files, test setup and starter tests',
  install: 'install',
  fix: 'fix: eslint and stylelint --fix',
};

// What to do next, once every stage has run: enter the directory, install what was skipped, run the gate.
const summary = (name: string, options: CliOptions, answers: Answers): string => {
  const { packageManager } = answers;
  const run = RUN_PREFIX[packageManager];
  const enter = options.skip.includes('scaffold') || name === '' ? [] : [`  cd ${name}`];
  const install = options.skip.includes('install') ? [`  ${packageManager} install`, `  ${run} lint:fix`] : [];

  return ['', 'Done. Next:', ...enter, ...install, `  ${run} check`].join('\n');
};

// Only the questionnaire can supply a missing name; every route that skips it already knows the name.
const askedFrom = async (
  options: CliOptions,
  prompter: Prompter,
  hasTerminal: boolean,
): Promise<Asked> => {
  const named = (answers: Answers): Asked => {
    return {
      name: options.name,
      answers,
    };
  };

  if (options.command === 'sync') {
    return named(await readLinteljsConfig(options.cwd));
  }

  if (options.skip.includes('scaffold') && await entryExists(join(options.cwd, CONFIG_PATH))) {
    return named(await readLinteljsConfig(options.cwd));
  }

  if (options.yes) {
    return named(flaggedAnswers(options.answers));
  }

  // Measured: four of seven agents piped `/dev/null` and silently took the default target.
  if (!hasTerminal) {
    throw new Error(NOTHING_ANSWERED_MESSAGE);
  }

  // With `--skip-scaffold` the directory is already named.
  const known = options.skip.includes('scaffold') ? basename(options.cwd) : options.name;

  return await ask(prompter, known === '' ? {} : { name: known });
};

const runSync = async (options: CliOptions, answers: Answers): Promise<void> => {
  const { pending } = await planSync(options.cwd, answers);

  if (pending.length === 0) {
    say('Everything is already up to date.');
    return;
  }

  say(`${String(pending.length)} file${pending.length === 1 ? '' : 's'} would change:`);

  for (const entry of pending) {
    say(`\n${entry.target}: ${entry.status}`);

    if (entry.diff !== '') {
      say(entry.diff);
    }
  }

  if (!options.force) {
    say('\nNothing written. Re-run with --force to overwrite the files listed above.');
    return;
  }

  const { written, removed } = await applySync(
    options.cwd,
    answers,
    pending.map((entry) => {
      return entry.target;
    }),
  );

  for (const target of written) {
    say(`wrote ${target}`);
  }

  for (const target of removed) {
    say(`removed ${target}`);
  }
};

// The argument only: a directory name was never chosen as a package name, and adopting one is what
// `--skip-scaffold` is for.
const projectNameError = (options: CliOptions): string | undefined => {
  if (options.command === 'sync' || options.name === '') {
    return undefined;
  }

  return isValidProjectName(options.name) ? undefined : `Project name must be ${PROJECT_NAME_RULE}.`;
};

// Every refusal of the argv, in the order a user meets them.
const argumentError = (options: CliOptions): string | undefined => {
  if (options.unexpectedArguments.length > 0) {
    const plural = options.unexpectedArguments.length === 1 ? '' : 's';

    return `Unexpected argument${plural}: ${options.unexpectedArguments.join(', ')}`;
  }

  if (options.unknownSkips.length > 0) {
    return `Not a stage: ${options.unknownSkips.join(', ')}. Pass one of: ${STAGES.join(', ')}.`;
  }

  return projectNameError(options);
};

// Returns the exit code rather than calling `process.exit`, which drops queued stderr writes.
export const main = async (argv: string[], prompter?: Prompter): Promise<number> => {
  let options: CliOptions;

  try {
    options = parseCliArgs(argv);
  }
  catch (error) {
    // `parseArgs` throws a `TypeError` and nothing else.
    /* v8 ignore next 3 */
    if (!(error instanceof Error)) {
      throw error;
    }

    console.error(error.message);

    return 1;
  }

  if (options.help) {
    say(USAGE);
    return 0;
  }

  if (options.version) {
    say(packageJson.version);
    return 0;
  }

  const refusal = argumentError(options);

  if (refusal !== undefined) {
    console.error(refusal);

    return 1;
  }

  // After `--help` and `--version`, which owe an answer on any Node, and before the questionnaire, which does not.
  const tooOld = nodeVersionRefusal(versions.node);

  if (tooOld !== undefined) {
    console.error(tooOld);

    return 1;
  }

  // Only the real prompter reads a real terminal, so only that path needs telling whether one is there.
  const hasTerminal = prompter !== undefined || stdin.isTTY;

  if (options.command === 'create') {
    say(`@linteljs/create ${packageJson.version}`);
  }

  try {
    const { name, answers } = await askedFrom(options, prompter ?? clackPrompter, hasTerminal);

    if (options.command === 'sync') {
      await runSync(options, answers);

      return 0;
    }

    ensurePackageManager(answers.packageManager, say);

    await runPipeline({
      // With --skip-scaffold the directory's existing name is the project's.
      name: name === '' ? basename(options.cwd) : name,
      // A scaffolder creates `<name>/` under cwd, so every later stage runs inside it.
      cwd: options.skip.includes('scaffold') ? options.cwd : resolve(options.cwd, name),
      answers,
      skip: options.skip,
      fresh: options.fresh,
      onWrite: (path) => {
        say(`  wrote ${path}`);
      },
      onNotice: (message) => {
        say(`  ${message}`);
      },
      onStage: (stage, index, count) => {
        say(`[${String(index)}/${String(count)}] ${STAGE_LABELS[stage]}`);
      },
    });

    say(summary(name, options, answers));
  }
  catch (error) {
    // Cancelling is not a failure: no "Error:" prefix, and 130, the SIGINT exit code.
    if (error instanceof Error && 'code' in error && error.code === 'CANCELLED') {
      say(error.message);

      return 130;
    }

    // One line, not a rethrow: an unhandled rejection over a half-written directory helps nobody.
    console.error(String(error));

    return 1;
  }

  return 0;
};
