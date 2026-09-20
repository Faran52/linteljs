import {
  basename,
  join,
  resolve,
} from 'node:path';
import {
  stdin,
  stdout,
  versions,
} from 'node:process';

import { RUN_PREFIX, STAGES } from '@config/constants';

import {
  type Answers,
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  parseLinteljsConfig,
} from '@answers';
import { entryExists, linteljsConfigReader } from '@disk';
import {
  applySync,
  pipelineRun,
  planSync,
} from '@pipeline';
import { packageManagerSpawn } from '@spawns';

import packageJson from '../../../package.json' with { type: 'json' };
import { PROJECT_NAME_RULE } from '../constants';
import { NOTHING_ANSWERED_MESSAGE } from '../prompts/constants';
import {
  ask,
  type Asked,
  clackPrompter,
  type Prompter,
} from '../prompts/prompts';
import { isValidProjectName } from '../utils/nameUtils';

import { STAGE_LABELS, USAGE } from './constants';
import {
  type AnswerFlags,
  type CliOptions,
  parseCliArgs,
} from './utils/argvUtils';
import { nodeVersionRefusal } from './utils/nodeUtils';

/**
 * `list` and `map` carry no `flag` on any of today's records, both being hand-edited only: `resolveConditions`,
 * `aliases` and `ignores` are recorded, never passed on the command line.
 * Through the config parser rather than a second validator: every flag gets the same message a bad config does.
 */
const flaggedAnswers = (flags: AnswerFlags = {}): Answers => {
  return parseLinteljsConfig(JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...DEFAULT_ANSWERS,
    ...flags,
  }));
};

// stdout for what the user asked to see; `console.error` for failures.
const say = (message: string): void => {
  stdout.write(`${message}\n`);
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
    return named(await linteljsConfigReader(options.cwd));
  }

  if (options.skip.includes('scaffold') && await entryExists(join(options.cwd, CONFIG_PATH))) {
    return named(await linteljsConfigReader(options.cwd));
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

    packageManagerSpawn(answers.packageManager, say);

    await pipelineRun({
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
