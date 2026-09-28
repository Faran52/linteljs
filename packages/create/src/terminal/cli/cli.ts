import {
  basename,
  join,
  resolve,
} from 'node:path';
import { stdin } from 'node:process';

import {
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

import packageJson from '../../../package.json' with { type: 'json' };
import {
  filled,
  type Host,
  hosted,
  hostOf,
} from '../host/host';
import { NOTHING_ANSWERED_MESSAGE } from '../prompts/constants';
import {
  ask,
  inquirerPrompter,
  type Prompter,
  RunCancelled,
} from '../prompts/prompts';

import { USAGE } from './constants';
import {
  type AnswerFlags,
  argumentError,
  type CliOptions,
  parseCliArgs,
} from './utils/argvUtils';
import {
  nextSteps,
  say,
  stageReport,
} from './utils/reportUtils';

import type { Answers, HostedAnswers } from '@config/types';

interface HostedAsk {
  name: string;
  answers: HostedAnswers;
}

const flaggedAnswers = (flags: AnswerFlags = {}): Answers => {
  return parseLinteljsConfig(JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...DEFAULT_ANSWERS,
    ...flags,
  }));
};

// Only the questionnaire can supply a missing name.
const askedFrom = async (
  options: CliOptions,
  prompter: Prompter,
  hasTerminal: boolean,
  host: Host,
): Promise<HostedAsk> => {
  const named = (answers: Answers): HostedAsk => {
    return {
      name: options.name,
      answers: hosted(answers, host),
    };
  };

  const fromConfig = (answers: Answers): HostedAsk => {
    return {
      name: options.name,
      answers: filled(answers, host),
    };
  };

  if (options.command === 'sync') {
    return fromConfig(await linteljsConfigReader(options.cwd));
  }

  if (options.existing && await entryExists(join(options.cwd, CONFIG_PATH))) {
    return fromConfig(await linteljsConfigReader(options.cwd));
  }

  if (options.yes) {
    return named(flaggedAnswers(options.answers));
  }

  // Measured: four of seven agents piped `/dev/null` and silently took the default target.
  if (!hasTerminal) {
    throw new Error(NOTHING_ANSWERED_MESSAGE);
  }

  const known = options.existing ? basename(options.cwd) : options.name;
  const asked = await ask(prompter, known === '' ? {} : { name: known });

  return {
    name: asked.name,
    answers: hosted(asked.answers, host),
  };
};

const runSync = async (options: CliOptions, answers: HostedAnswers): Promise<void> => {
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

  const targets = pending
    .map((entry) => {
      return entry.target;
    });

  const { written, removed } = await applySync(
    options.cwd,
    answers,
    targets,
  );

  for (const target of written) {
    say(`wrote ${target}`);
  }

  for (const target of removed) {
    say(`removed ${target}`);
  }
};

// Not `process.exit`, which drops queued stderr writes.
export const main = async (argv: string[], prompter?: Prompter): Promise<number> => {
  let options: CliOptions;

  try {
    options = parseCliArgs(argv);
  }
  catch (error) {
    // An Error from another realm fails `instanceof`.
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

  // After `--help` and `--version`, which owe an answer on any machine.
  const host = await hostOf(options.cwd);

  if (typeof host === 'string') {
    console.error(host);

    return 1;
  }

  const hasTerminal = prompter !== undefined || stdin.isTTY;

  if (options.command === 'create') {
    say(`@linteljs/create ${packageJson.version}`);
  }

  try {
    const { name, answers } = await askedFrom(options, prompter ?? inquirerPrompter, hasTerminal, host);

    if (options.command === 'sync') {
      await runSync(options, answers);

      return 0;
    }

    await pipelineRun({
      name: name === '' ? basename(options.cwd) : name,
      cwd: options.existing ? options.cwd : resolve(options.cwd, name),
      answers,
      skip: options.skip,
      existing: options.existing,
      seed: options.seed,
      ...stageReport(options),
    });

    say(nextSteps(name, options, answers.packageManager));
  }
  catch (error) {
    // Cancelling is not a failure: no "Error:" prefix, and 130, the SIGINT exit code.
    if (error instanceof RunCancelled) {
      say(error.message);

      return 130;
    }

    // One line, not a rethrow: an unhandled rejection over a half-written directory helps nobody.
    console.error(String(error));

    return 1;
  }

  return 0;
};
