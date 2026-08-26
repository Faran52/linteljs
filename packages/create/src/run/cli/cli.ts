import {
  basename,
  join,
  resolve,
} from 'node:path';
import {
  cwd as processCwd,
  stdin,
  stdout,
} from 'node:process';
import { parseArgs } from 'node:util';

import {
  type Answers,
  DEFAULT_ANSWERS,
  isValidProjectName,
  PROJECT_NAME_RULE,
} from '../../model/answers/answers';
import { CONFIG_PATH, readLintelConfig } from '../../model/config/lintelConfig';
import { type Stage, STAGES } from '../../model/stages/stages';
import { runPipeline } from '../pipeline/pipeline';
import {
  ask,
  type Asked,
  clackPrompter,
  NOTHING_ANSWERED_MESSAGE,
  type Prompter,
} from '../prompts/prompts';
import { applySync, planSync } from '../sync/sync';
import { entryExists } from '../utils/fsUtils';

export interface CliOptions {
  command: 'create' | 'sync';
  name: string;
  cwd: string;
  skip: Stage[];
  // `--skip` values naming no stage, and positionals past the name. Carried rather than thrown on, so `main` reports
  // all of them the same way; what `parseArgs` itself rejects still throws, and `main` catches that.
  unknownSkips: string[];
  unexpectedArguments: string[];
  yes: boolean;
  fresh: boolean;
  force: boolean;
  help: boolean;
}

// Everything the user asked to see goes to stdout via `stdout.write`, not `console.log`/`console.warn` (which is stderr
// and satisfies `no-console`); `console.error` stays for failures.
const say = (message: string): void => {
  stdout.write(`${message}\n`);
};

const USAGE = `@linteljs/create [name] [options]
@linteljs/create sync [options]

  --skip-scaffold   run stages 2-6 against an existing repository
  --no-install      skip the install and the eslint --fix pass that needs it
  --fresh           with --skip-scaffold, treat the directory as new scaffolder output
  --skip <stage>    skip a stage: scaffold, lint, package, standard, install, fix (repeatable)
  --yes, -y         accept the defaults, ask nothing
  --force           sync: overwrite without asking
  --help, -h

A non-interactive create needs a project name and --yes to accept the defaults on purpose.
`;

const isStage = (value: string): value is Stage => {
  return STAGES.some((stage) => {
    return stage === value;
  });
};

export const parseCliArgs = (argv: string[]): CliOptions => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
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
    },
  });

  const [first = '', ...unexpectedArguments] = positionals;
  const command = first === 'sync' ? 'sync' : 'create';
  const skip: Stage[] = values.skip.filter(isStage);
  const unknownSkips = values.skip.filter((value) => {
    return !isStage(value);
  });

  if (values['skip-scaffold'] && !skip.includes('scaffold')) {
    skip.push('scaffold');
  }

  // Declines both install and fix, since the fix pass reads `node_modules`; named `no-install` because `parseArgs` has
  // no `--no-` negation, so a boolean `install` option would reject the flag itself.
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
    yes: values.yes,
    fresh: values.fresh,
    force: values.force,
    help: values.help,
  };
};

/**
 * The name comes back beside the answers because only the questionnaire can supply a missing one, and every route
 * that skips the questionnaire already knows it: `sync` never scaffolds, `--skip-scaffold` keeps the directory's own
 * name, and `--yes` means the argument was the last word on it.
 */
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

  // The parsed config is the plan's answers, with no conversion between the two. See `LintelConfig`.
  if (options.command === 'sync') {
    return named(await readLintelConfig(options.cwd));
  }

  if (options.skip.includes('scaffold') && await entryExists(join(options.cwd, CONFIG_PATH))) {
    return named(await readLintelConfig(options.cwd));
  }

  if (options.yes) {
    return named(DEFAULT_ANSWERS);
  }

  /**
   * A pipe, a hook or CI leaves no terminal to answer from; measured at four of seven agents piping `/dev/null` and
   * silently getting the default target, hence refusing outright rather than asking clack to read a stream that
   * isn't there.
   */
  if (!hasTerminal) {
    throw new Error(NOTHING_ANSWERED_MESSAGE);
  }

  // Only a run that creates a directory has a name to choose. With `--skip-scaffold` the directory is already there
  // and already named, so the question is answered before it is asked.
  const known = options.skip.includes('scaffold') ? basename(options.cwd) : options.name;

  return await ask(prompter, known === '' ? {} : { name: known });
};

const runSync = async (options: CliOptions, answers: Answers): Promise<void> => {
  const { pending } = await planSync(options.cwd, answers);

  if (pending.length === 0) {
    say('Everything is already up to date.');
    return;
  }

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

/**
 * A name that cannot be a package name, refused before anything runs rather than at install.
 *
 * The argument only. A run with no argument takes the directory's name, and that one is left alone deliberately: a
 * directory is not chosen as a package name and often cannot be one, so refusing `~/Projects/MyApp` would stop a run
 * over something the user never typed. Adopting a directory is exactly what `--skip-scaffold` is for.
 */
const projectNameError = (options: CliOptions): string | undefined => {
  if (options.command === 'sync' || options.name === '') {
    return undefined;
  }

  return isValidProjectName(options.name) ? undefined : `Project name must be ${PROJECT_NAME_RULE}.`;
};

// Every reason to refuse the argv itself, in the order a user meets them, so `main` carries one bail-out rather than
// one per reason.
const argumentError = (options: CliOptions): string | undefined => {
  if (options.unexpectedArguments.length > 0) {
    const plural = options.unexpectedArguments.length === 1 ? '' : 's';

    return `Unexpected argument${plural}: ${options.unexpectedArguments.join(', ')}`;
  }

  // Stopping is the only honest answer for an unknown skip: the run asked for is not the run that would happen.
  if (options.unknownSkips.length > 0) {
    return `Not a stage: ${options.unknownSkips.join(', ')}. Pass one of: ${STAGES.join(', ')}.`;
  }

  return projectNameError(options);
};

// Returns the exit code rather than calling `process.exit`, which would drop queued stderr writes;
// `bin/create-linteljs.js` assigns it to `process.exitCode`.
export const main = async (argv: string[], prompter?: Prompter): Promise<number> => {
  let options: CliOptions;

  try {
    options = parseCliArgs(argv);
  }
  catch (error) {
    // `parseArgs` throws a `TypeError` and nothing else, so no test can stage the other arm, hence the ignore.
    /* v8 ignore next 3 */
    if (!(error instanceof Error)) {
      throw error;
    }

    // The message alone: the class name of what `parseArgs` threw is not something a user asked about.
    console.error(error.message);

    return 1;
  }

  if (options.help) {
    say(USAGE);
    return 0;
  }

  const refusal = argumentError(options);

  if (refusal !== undefined) {
    console.error(refusal);

    return 1;
  }

  // A prompter passed in stands in for a person, the way tests use it; only the real default reads the real
  // terminal, so only that path needs telling whether one is there.
  const hasTerminal = prompter !== undefined || stdin.isTTY;

  try {
    const { name, answers } = await askedFrom(options, prompter ?? clackPrompter, hasTerminal);

    if (options.command === 'sync') {
      await runSync(options, answers);

      return 0;
    }

    await runPipeline({
      // With --skip-scaffold there's no name argument and none was asked for, so the directory's existing name is
      // what package.json and the adapters should keep calling it.
      name: name === '' ? basename(options.cwd) : name,
      // A scaffolder creates `<name>/` under the current directory, so every later stage runs inside it, knowable only
      // after stage 1 picks a name.
      cwd: options.skip.includes('scaffold') ? options.cwd : resolve(options.cwd, name),
      answers,
      skip: options.skip,
      fresh: options.fresh,
      onWrite: (path) => {
        say(`wrote ${path}`);
      },
      onNotice: (message) => {
        say(message);
      },
    });
  }
  catch (error) {
    // A person cancelling the questionnaire is not a failure: no "Error:" prefix, no advice to answer every
    // question, and 130, the conventional exit code for a SIGINT, rather than 1.
    if (error instanceof Error && 'code' in error && error.code === 'CANCELLED') {
      say(error.message);

      return 130;
    }

    // A stage that threw, surfaced as one line: what reaches here is a scaffolder that died, a disk that filled, or an
    // uninstalled package manager; rethrowing would surface an unhandled rejection over a half-written directory.
    console.error(String(error));

    return 1;
  }

  return 0;
};
