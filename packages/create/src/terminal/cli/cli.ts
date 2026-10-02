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
  confirm,
  inquirerPrompter,
  type Prompter,
  RunCancelled,
} from '../prompts/prompts';

import { SYNC_NEEDS_YES, USAGE } from './constants';
import {
  type AnswerFlags,
  argumentError,
  type CliOptions,
  parseCliArgs,
} from './utils/argvUtils';
import {
  installCommands,
  nextSteps,
  say,
  stageReport,
  syncTable,
} from './utils/reportUtils';

import type { Answers, HostedAnswers } from '@config/types';

interface HostedAsk {
  name: string;
  answers: HostedAnswers;
}

const EXIT_CANCELLED = 130;

const flaggedAnswers = (flags: AnswerFlags = {}): Answers => {
  const configText = JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...DEFAULT_ANSWERS,
    ...flags,
  });

  return parseLinteljsConfig(configText);
};

// Only the questionnaire can supply a missing name.
const askedFrom = async (
  options: CliOptions,
  prompter: Prompter,
  hasTerminal: boolean,
  host: Host,
): Promise<HostedAsk> => {
  const named = (answers: Answers): HostedAsk => {
    const resolved: HostedAsk = {
      name: options.name,
      answers: hosted(answers, host),
    };

    return resolved;
  };

  const fromConfig = (answers: Answers): HostedAsk => {
    const recorded: HostedAsk = {
      name: options.name,
      answers: filled(answers, host),
    };

    return recorded;
  };

  if (options.command === 'sync') {
    const config = await linteljsConfigReader(options.cwd);

    return fromConfig(config);
  }

  const hasConfig = options.existing && await entryExists(join(options.cwd, CONFIG_PATH));

  if (hasConfig) {
    const config = await linteljsConfigReader(options.cwd);

    return fromConfig(config);
  }

  if (options.yes) {
    const flagged = flaggedAnswers(options.answers);

    return named(flagged);
  }

  // Measured: four of seven agents piped `/dev/null` and silently took the default target.
  if (!hasTerminal) {
    throw new Error(NOTHING_ANSWERED_MESSAGE);
  }

  const known = options.existing ? basename(options.cwd) : options.name;
  const prefilled = known === '' ? {} : { name: known };
  const asked = await ask(prompter, prefilled);
  const answered: HostedAsk = {
    name: asked.name,
    answers: hosted(asked.answers, host),
  };

  return answered;
};

const runSync = async (
  options: CliOptions,
  answers: HostedAnswers,
  prompter: Prompter,
  hasTerminal: boolean,
): Promise<number> => {
  const plan = await planSync(options.cwd, answers);
  const install = installCommands(answers.packageManager, plan.missing);

  if (install.length > 0) {
    const heading = 'linteljs needs packages this project does not have. sync leaves dependencies to you:';

    const notice = [heading, ...install].join('\n');

    say(notice);
  }

  if (plan.pending.length === 0) {
    say('Everything is already up to date.');
    return 0;
  }

  say(`sync would change:\n${syncTable(plan)}`);

  if (!options.yes) {
    if (!hasTerminal) {
      console.error(SYNC_NEEDS_YES);
      return 1;
    }

    const approved = await confirm(prompter, 'Apply these changes?');

    if (!approved) {
      say('Nothing was written.');
      return 0;
    }
  }

  const targets = plan.pending
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

  return 0;
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
      return await runSync(options, answers, prompter ?? inquirerPrompter, hasTerminal);
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

      return EXIT_CANCELLED;
    }

    // One line, not a rethrow: an unhandled rejection over a half-written directory helps nobody.
    console.error(String(error));

    return 1;
  }

  return 0;
};
