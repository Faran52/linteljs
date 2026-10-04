import {
  basename,
  join,
  resolve,
} from 'node:path';
import { stdin } from 'node:process';

import { ESLINT_CONFIG_PATH } from '@config/constants';

import { unscopedName } from '@utils/nameUtils';

import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  LEGACY_CONFIG_PATH,
  parseLinteljsConfig,
} from '@answers';
import {
  entryExists,
  linteljsConfigReader,
  readIfPresent,
} from '@disk';
import { parsePackageJson, type Upgrade } from '@emitters';
import {
  type LintConfigPlan,
  pipelineRun,
  planSync,
  runnerSwitch,
  syncPlugin,
  writeDependencies,
  writeLintConfig,
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
import { isValidProjectName } from '../utils/nameUtils';

import { SYNC_NEEDS_YES } from './constants';
import {
  type AnswerFlags,
  argumentError,
  type CliOptions,
  parseCliArgs,
} from './utils/argvUtils';
import { usage } from './utils/flagUtils';
import {
  nextSteps,
  say,
  stageReport,
  upgradeTable,
} from './utils/reportUtils';

import type { Answers, HostedAnswers } from '@config/types';

interface HostedAsk {
  name: string;
  answers: HostedAnswers;
}

type Step = 'done' | 'declined' | 'blocked';

interface Asker {
  isYes: boolean;
  prompter: Prompter;
  hasTerminal: boolean;
}

interface DependencyStep {
  changes: Upgrade[];
  heading: string;
  question: string;
  done: string;
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

// `--existing` takes the name its package.json records, as a new project takes its argument's.
const existingName = async (cwd: string): Promise<string> => {
  const manifestText = await readIfPresent(join(cwd, 'package.json'));
  const recorded = manifestText === null ? undefined : parsePackageJson(manifestText).name;

  return recorded !== undefined && isValidProjectName(recorded) ? recorded : basename(cwd);
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

  // A 1.x project records its answers under the old name.
  const hasCurrent = options.existing && await entryExists(join(options.cwd, CONFIG_PATH));
  const hasConfig = hasCurrent || (options.existing && await entryExists(join(options.cwd, LEGACY_CONFIG_PATH)));

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

  const known = options.existing ? await existingName(options.cwd) : options.name;
  const prefilled = known === '' ? {} : { name: known };
  const asked = await ask(prompter, prefilled);
  const answered: HostedAsk = {
    name: asked.name,
    answers: hosted(asked.answers, host),
  };

  return answered;
};

// `--yes` accepts; with no terminal the step writes nothing and the run fails, so a script notices.
const stepOf = async (asker: Asker, heading: string, question: string): Promise<Step> => {
  say(heading);

  if (asker.isYes) {
    return 'done';
  }

  if (!asker.hasTerminal) {
    console.error(SYNC_NEEDS_YES);

    return 'blocked';
  }

  const isApproved = await confirm(asker.prompter, question);

  return isApproved ? 'done' : 'declined';
};

const dependencyStep = async (cwd: string, asker: Asker, step: DependencyStep): Promise<Step> => {
  const {
    changes,
    heading,
    question,
    done,
  } = step;

  if (changes.length === 0) {
    return 'done';
  }

  const outcome = await stepOf(asker, `${heading}\n${upgradeTable(changes)}`, question);

  if (outcome === 'done') {
    await writeDependencies(cwd, changes);
    say(done);
  }

  return outcome;
};

// A missing config is written; one the project has is moved aside only when asked.
const lintConfigStep = async (
  cwd: string,
  asker: Asker,
  answers: HostedAnswers,
  plan: LintConfigPlan,
): Promise<Step> => {
  if (plan.status !== 'changed') {
    if (plan.status === 'missing') {
      await writeLintConfig(cwd, answers, plan);
      say(`wrote ${ESLINT_CONFIG_PATH}`);
    }

    return 'done';
  }

  const { path, backup } = plan;
  const question = `Move it to ${backup} and write ${ESLINT_CONFIG_PATH}?`;
  const outcome = await stepOf(asker, `${path} differs from the config linteljs writes.`, question);

  if (outcome === 'done') {
    await writeLintConfig(cwd, answers, plan);
    say(`moved ${path} to ${backup}, wrote ${ESLINT_CONFIG_PATH}`);
  }

  return outcome;
};

const runSync = async (
  options: CliOptions,
  answers: HostedAnswers,
  prompter: Prompter,
  hasTerminal: boolean,
): Promise<number> => {
  const switched = await runnerSwitch(options.cwd, answers);

  if (switched !== null) {
    const { from, to } = switched;

    const message = [
      `Nothing was written: this project runs its suites on ${from}, and linteljs now runs them on ${to}.`,
      'sync changes no runner, since the suites, setup and test scripts are the project\'s.',
      `Port them to ${to}, swap the dependencies, and run sync again.`,
    ].join(' ');

    console.error(message);

    return 1;
  }

  const { cwd } = options;
  const { written, removed } = await syncPlugin(cwd, answers);

  for (const target of written) {
    say(`wrote ${target}`);
  }

  for (const target of removed) {
    say(`removed ${target}`);
  }

  const plan = await planSync(cwd, answers);
  const {
    upgrades,
    peers,
    eslintConfig,
  } = plan;
  const isCurrent = written.length + removed.length + upgrades.length + peers.length === 0
    && eslintConfig.status === 'unchanged';

  if (isCurrent) {
    say('Everything is already up to date.');
    return 0;
  }

  const asker: Asker = {
    isYes: options.yes,
    prompter,
    hasTerminal,
  };
  const dependencies: DependencyStep[] = [
    {
      changes: upgrades,
      heading: '@linteljs/* versions behind:',
      question: 'Update them in package.json?',
      done: 'wrote package.json',
    },
    {
      changes: peers,
      heading: '@linteljs/eslint-config peers missing or behind:',
      question: 'Add or update them in package.json?',
      done: `wrote package.json. Install them:\n  ${answers.packageManager} install`,
    },
  ];
  const steps: Step[] = [];

  for (const step of dependencies) {
    const outcome = await dependencyStep(cwd, asker, step);

    steps.push(outcome);
  }

  const lintOutcome = await lintConfigStep(cwd, asker, answers, eslintConfig);

  steps.push(lintOutcome);

  return steps.includes('blocked') ? 1 : 0;
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
    say(usage());
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

    const projectName = name === '' ? await existingName(options.cwd) : name;
    const directory = unscopedName(name);

    await pipelineRun({
      name: projectName,
      cwd: options.existing ? options.cwd : resolve(options.cwd, directory),
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
