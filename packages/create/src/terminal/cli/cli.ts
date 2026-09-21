import {
  basename,
  join,
  resolve,
} from 'node:path';
import {
  env,
  stdin,
  versions,
} from 'node:process';

import {
  NODE_FLOOR,
  RUN_PREFIX,
  STAGES,
} from '@config/constants';

import {
  type Answers,
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  type PackageManager,
  parseLinteljsConfig,
} from '@answers';
import {
  entryExists,
  linteljsConfigReader,
  readIfPresent,
} from '@disk';
import {
  applySync,
  pipelineRun,
  planSync,
} from '@pipeline';
import { nodeSpawn, packageManagerSpawn } from '@spawns';

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

import { LOCKFILES, USAGE } from './constants';
import {
  type AnswerFlags,
  type CliOptions,
  parseCliArgs,
} from './utils/argvUtils';
import {
  type DetectedManager,
  managerFromUserAgent,
  managerRefusal,
  nodeRefusal,
  yarnFromLockfile,
} from './utils/hostUtils';
import { say, stageReport } from './utils/reportUtils';

interface Host {
  packageManager: PackageManager;
  packageManagerVersion: string | undefined;
  nodeVersion: string;
}

const flaggedAnswers = (flags: AnswerFlags = {}): Answers => {
  return parseLinteljsConfig(JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...DEFAULT_ANSWERS,
    ...flags,
  }));
};

// What to do next, once every stage has run: enter the directory, install what was skipped, run the gate.
const summary = (name: string, options: CliOptions, answers: Answers): string => {
  const { packageManager } = answers;
  const run = RUN_PREFIX[packageManager];
  const enter = options.skip.includes('scaffold') || name === '' ? [] : [`  cd ${name}`];
  const install = options.skip.includes('install') ? [`  ${packageManager} install`, `  ${run} lint:fix`] : [];

  return ['', 'Done. Next:', ...enter, ...install, `  ${run} check`].join('\n');
};

// The manager that invoked this CLI, which is the one a generated project keeps: the user agent every scaffolder
// reads, else the lockfile the directory already has, else npm, which is what a bare `node .../create` is.
const detectedManager = async (cwd: string): Promise<DetectedManager> => {
  const fromAgent = managerFromUserAgent(env['npm_config_user_agent']);

  if (fromAgent !== undefined) {
    return fromAgent;
  }

  const present = await Promise.all(LOCKFILES.map(async ([lockfile, name]) => {
    return await entryExists(join(cwd, lockfile)) ? name : undefined;
  }));

  const found = present.find((name) => {
    return name !== undefined;
  }) ?? 'npm';

  return {
    // `yarn.lock` names yarn without saying which one, and the two are different managers here.
    name: found === 'yarn' ? yarnFromLockfile(await readIfPresent(join(cwd, 'yarn.lock'))) : found,
    version: undefined,
  };
};

// A fresh run records the host: the manager question is gone, so `packageManager` on the answers is a placeholder
// until here. `exactOptionalPropertyTypes` is on, so an absent version is an absent key rather than an undefined one.
const hosted = (answers: Answers, host: Host): Answers => {
  return {
    ...answers,
    packageManager: host.packageManager,
    ...host.packageManagerVersion === undefined ? {} : { packageManagerVersion: host.packageManagerVersion },
    nodeVersion: host.nodeVersion,
  };
};

/**
 * A config already recorded a manager, so it wins and the host fills only what a config written before these were
 * recorded lacks. The version fills only where the two agree on the manager: this machine's pnpm version says
 * nothing about a project that records npm, and `packageManager` would then name a version that manager never had.
 */
const filled = (answers: Answers, host: Host): Answers => {
  const sameManager = answers.packageManager === host.packageManager;

  return {
    ...answers,
    ...answers.packageManagerVersion === undefined && sameManager && host.packageManagerVersion !== undefined
      ? { packageManagerVersion: host.packageManagerVersion }
      : {},
    ...answers.nodeVersion === undefined ? { nodeVersion: host.nodeVersion } : {},
  };
};

/**
 * The machine this run records, or the one sentence that stops it: the manager that invoked the CLI has to be one a
 * project of ours can be installed by, and the Node a generated project will run on has to be one this CLI can write
 * for. Answered rather than thrown, like `argumentError` above, and asked before the questionnaire.
 */
const hostOf = async (cwd: string): Promise<Host | string> => {
  const manager = await detectedManager(cwd);
  const packageManagerVersion = manager.version ?? packageManagerSpawn(manager.name);
  const wrongManager = managerRefusal(manager.name, packageManagerVersion);

  if (wrongManager !== undefined) {
    return wrongManager;
  }

  // bun runs this CLI itself, so `versions.node` there is the Node bun bundles rather than the one a project runs on.
  const nodeVersion = versions['bun'] === undefined ? versions.node : nodeSpawn();

  if (nodeVersion === undefined) {
    return 'bun ran this, and the project it writes runs on Node. '
      + `Install Node ${NODE_FLOOR} or newer and run this again.`;
  }

  return nodeRefusal(nodeVersion) ?? {
    packageManager: manager.name,
    packageManagerVersion,
    nodeVersion,
  };
};

// Only the questionnaire can supply a missing name; every route that skips it already knows the name.
const askedFrom = async (
  options: CliOptions,
  prompter: Prompter,
  hasTerminal: boolean,
  host: Host,
): Promise<Asked> => {
  const named = (answers: Answers): Asked => {
    return {
      name: options.name,
      answers: hosted(answers, host),
    };
  };

  const fromConfig = (answers: Answers): Asked => {
    return {
      name: options.name,
      answers: filled(answers, host),
    };
  };

  if (options.command === 'sync') {
    return fromConfig(await linteljsConfigReader(options.cwd));
  }

  if (options.skip.includes('scaffold') && await entryExists(join(options.cwd, CONFIG_PATH))) {
    return fromConfig(await linteljsConfigReader(options.cwd));
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
  const asked = await ask(prompter, known === '' ? {} : { name: known });

  return {
    name: asked.name,
    answers: hosted(asked.answers, host),
  };
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

  // After `--help` and `--version`, which owe an answer on any machine, and before the questionnaire, which does not.
  const host = await hostOf(options.cwd);

  if (typeof host === 'string') {
    console.error(host);

    return 1;
  }

  // Only the real prompter reads a real terminal, so only that path needs telling whether one is there.
  const hasTerminal = prompter !== undefined || stdin.isTTY;

  if (options.command === 'create') {
    say(`@linteljs/create ${packageJson.version}`);
  }

  try {
    const { name, answers } = await askedFrom(options, prompter ?? clackPrompter, hasTerminal, host);

    if (options.command === 'sync') {
      await runSync(options, answers);

      return 0;
    }

    await pipelineRun({
      // With --skip-scaffold the directory's existing name is the project's.
      name: name === '' ? basename(options.cwd) : name,
      // A scaffolder creates `<name>/` under cwd, so every later stage runs inside it.
      cwd: options.skip.includes('scaffold') ? options.cwd : resolve(options.cwd, name),
      answers,
      skip: options.skip,
      fresh: options.fresh,
      ...stageReport(options),
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
