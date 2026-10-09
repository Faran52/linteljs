import {
  basename,
  join,
  resolve,
} from 'node:path';
import { stdin } from 'node:process';

import { ESLINT_CONFIG_PATH } from '@config/constants';

import { unscopedName } from '@utils/nameUtils';

import {
  ANSWERS,
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  configOf,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  LEGACY_CONFIG_PATH,
  type LinteljsConfig,
  parseLinteljsConfig,
  projectAnswersOf,
} from '@answers';
import {
  entryExists,
  globPaths,
  linteljsConfigReader,
  readIfPresent,
} from '@disk';
import { parsePackageJson, type Upgrade } from '@emitters';
import {
  addPackage,
  appRootOf,
  type LintConfigPlan,
  pipelineRun,
  planSync,
  runnerSwitch,
  syncPlugin,
  writeDependencies,
  writeLintConfig,
} from '@pipeline';
import { runSpawn } from '@spawns';
import { targetFor } from '@targets';

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
  type Asked,
  type AskedProject,
  confirm,
  inquirerPrompter,
  type Prompter,
  RunCancelled,
} from '../prompts/prompts';
import { isValidProjectName } from '../utils/nameUtils';

import {
  ADD_NEEDS_MONOREPO,
  EXISTING_MONOREPO,
  SYNC_NEEDS_YES,
} from './constants';
import {
  type AnswerFlags,
  argumentError,
  type CliOptions,
  parseCliArgs,
  type ProjectFlags,
} from './utils/argvUtils';
import { usage } from './utils/flagUtils';
import {
  nextSteps,
  say,
  stageReport,
  upgradeTable,
} from './utils/reportUtils';

import type {
  Answers,
  HostedAnswers,
  Workspace,
  WorkspaceProject,
} from '@config/types';

// `projects` for a monorepo, named for their directories; `answers` stays the first's.
interface HostedAsk {
  name: string;
  answers: HostedAnswers;
  projects?: Workspace['projects'];
}

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

const flaggedAnswers = (name: string, flags: AnswerFlags = {}): Answers => {
  const configText = JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...configOf({
      ...DEFAULT_ANSWERS,
      // `none` fits every target; an unflagged answer takes the target's runner below.
      testing: 'none',
      ...flags,
    }, name),
  });

  const config = parseLinteljsConfig(configText);
  const parsed = projectAnswersOf(config, config.projects[0]);
  const record = targetFor(parsed);
  const plugins = flags.plugins === undefined ? ANSWERS.plugins.targetDefault([record]) : undefined;

  const answers: Answers = {
    ...parsed,
    ...(flags.testing === undefined ? { testing: record.testRunner ?? DEFAULT_ANSWERS.testing } : {}),
    ...(plugins === undefined ? {} : { plugins }),
  };

  return answers;
};

// Each project on the workspace flags under its own; `plugins` offers what any project offers.
const flaggedProjects = (options: CliOptions, projects: [ProjectFlags, ...ProjectFlags[]], host: Host): HostedAsk => {
  const flagOne = (project: ProjectFlags): WorkspaceProject => {
    const answers = flaggedAnswers(project.name, {
      ...options.answers,
      ...(project.kind === 'package' ? { target: 'typescript' } : {}),
      ...project.answers,
    });
    const flagged: WorkspaceProject = {
      name: project.name,
      answers: hosted(answers, host),
    };

    return flagged;
  };

  const [first, ...rest] = projects;
  const flagged: Workspace['projects'] = [flagOne(first), ...rest.map(flagOne)];
  const records = flagged
    .map(({ answers }) => {
      return targetFor(answers);
    });
  const plugins = options.answers?.plugins === undefined
    ? ANSWERS.plugins.targetDefault(records) ?? DEFAULT_ANSWERS.plugins
    : flagged[0].answers.plugins;
  const answers: HostedAnswers = {
    ...flagged[0].answers,
    plugins,
  };

  const asked: HostedAsk = {
    name: options.name,
    answers,
    projects: [{
      name: first.name,
      answers,
    }, ...flagged.slice(1)],
  };

  return asked;
};

const askedProjects = (asked: Asked, host: Host): HostedAsk => {
  const [first, ...rest] = asked.projects;

  const hostOne = (project: AskedProject): WorkspaceProject => {
    const withHost: WorkspaceProject = {
      name: project.name,
      answers: hosted(project.answers, host),
    };

    return withHost;
  };

  const projects: Workspace['projects'] = [hostOne(first), ...rest.map(hostOne)];
  const answered: HostedAsk = {
    name: asked.name,
    answers: projects[0].answers,
    ...(projects[0].answers.layout === 'monorepo' ? { projects } : {}),
  };

  return answered;
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

  const fromConfig = (config: LinteljsConfig): HostedAsk => {
    const project = projectAnswersOf(config, config.projects[0]);
    const recorded: HostedAsk = {
      name: options.name,
      answers: filled(project, host),
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

  if (options.projects !== undefined) {
    return flaggedProjects(options, options.projects, host);
  }

  if (options.yes) {
    const flagged = flaggedAnswers(options.name, options.answers);

    return named(flagged);
  }

  // Measured: four of seven agents piped `/dev/null` and silently took the default target.
  if (!hasTerminal) {
    throw new Error(NOTHING_ANSWERED_MESSAGE);
  }

  const known = options.existing ? await existingName(options.cwd) : options.name;
  const prefilled = known === '' ? {} : { name: known };
  const fixed = options.existing ? { layout: 'single' } : {};
  const asked = await ask(prompter, {
    ...prefilled,
    fixed,
  });

  return askedProjects(asked, host);
};

// `--yes` accepts; with no terminal it is null: the step writes nothing and the run fails, so a script notices.
const stepOf = async (asker: Asker, heading: string, question: string): Promise<boolean | null> => {
  say(heading);

  if (asker.isYes) {
    return true;
  }

  if (!asker.hasTerminal) {
    console.error(SYNC_NEEDS_YES);

    return null;
  }

  return await confirm(asker.prompter, question);
};

// Each step resolves to whether it was blocked.
const dependencyStep = async (cwd: string, asker: Asker, step: DependencyStep): Promise<boolean> => {
  const {
    changes,
    heading,
    question,
    done,
  } = step;

  if (changes.length === 0) {
    return false;
  }

  const isApproved = await stepOf(asker, `${heading}\n${upgradeTable(changes)}`, question);

  if (isApproved === true) {
    await writeDependencies(cwd, changes);
    say(done);
  }

  return isApproved === null;
};

// A missing config is written; one the project has is moved aside only when asked.
const lintConfigStep = async (
  cwd: string,
  asker: Asker,
  answers: HostedAnswers,
  plan: LintConfigPlan,
): Promise<boolean> => {
  if (plan.status !== 'changed') {
    if (plan.status === 'missing') {
      await writeLintConfig(cwd, answers, plan);
      say(`wrote ${ESLINT_CONFIG_PATH}`);
    }

    return false;
  }

  const { path, backup } = plan;
  const question = `Move it to ${backup} and write ${ESLINT_CONFIG_PATH}?`;
  const isApproved = await stepOf(asker, `${path} differs from the config linteljs writes.`, question);

  if (isApproved === true) {
    await writeLintConfig(cwd, answers, plan);
    say(`moved ${path} to ${backup}, wrote ${ESLINT_CONFIG_PATH}`);
  }

  return isApproved === null;
};

// An app of the same name would give the workspace two packages under one name.
const runAdd = async (options: CliOptions, answers: HostedAnswers, name: string): Promise<number> => {
  const { cwd, skip } = options;
  const binary = answers.packageManager;

  if (answers.layout !== 'monorepo') {
    console.error(ADD_NEEDS_MONOREPO);

    return 1;
  }

  const [taken] = globPaths(cwd, `{apps,packages}/${name}`);

  if (taken !== undefined) {
    console.error(`${taken} exists: sync --add writes a new package.`);

    return 1;
  }

  const written = await addPackage(cwd, answers, name);

  for (const target of written) {
    say(`wrote ${target}`);
  }

  if (skip.includes('install')) {
    say(`Install it:\n  ${binary} install`);

    return 0;
  }

  // The lockfile takes the package now, so the frozen install CI runs passes.
  say(`installing with ${binary}`);
  await runSpawn(binary, ['install'], cwd);

  return 0;
};

const runSync = async (
  options: CliOptions,
  answers: HostedAnswers,
  prompter: Prompter,
  hasTerminal: boolean,
): Promise<number> => {
  const { cwd } = options;
  const app = appRootOf(cwd, answers);
  const switched = await runnerSwitch(app, answers);

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

  const { written, removed } = await syncPlugin(cwd, answers);

  for (const target of written) {
    say(`wrote ${target}`);
  }

  for (const target of removed) {
    say(`removed ${target}`);
  }

  const plan = await planSync(app, answers);
  const {
    upgrades,
    peers,
    eslintConfig,
  } = plan;
  const changeLists = [
    written,
    removed,
    upgrades,
    peers,
  ];
  const isEmpty = changeLists
    .every((entries) => {
      return entries.length === 0;
    });
  const isCurrent = isEmpty && eslintConfig.status === 'unchanged';

  if (isCurrent) {
    say('Everything is already up to date.');
    return 0;
  }

  const asker: Asker = {
    isYes: options.yes,
    prompter,
    hasTerminal,
  };
  const upgradeStep: DependencyStep = {
    changes: upgrades,
    heading: '@linteljs/* versions behind:',
    question: 'Update them in package.json?',
    done: 'wrote package.json',
  };
  const peerStep: DependencyStep = {
    changes: peers,
    heading: 'Lint dependencies missing or behind:',
    question: 'Add or update them in package.json?',
    done: `wrote package.json. Install them:\n  ${answers.packageManager} install`,
  };
  const isUpgradeBlocked = await dependencyStep(app, asker, upgradeStep);
  const isPeerBlocked = await dependencyStep(app, asker, peerStep);
  const isLintBlocked = await lintConfigStep(app, asker, answers, eslintConfig);
  const blocked = [
    isUpgradeBlocked,
    isPeerBlocked,
    isLintBlocked,
  ];

  return blocked.includes(true) ? 1 : 0;
};

const parsedOptions = (argv: string[]): CliOptions | undefined => {
  try {
    return parseCliArgs(argv);
  }
  catch (error) {
    // An Error from another realm fails `instanceof`.
    if (!(error instanceof Error)) {
      throw error;
    }

    console.error(error.message);

    return undefined;
  }
};

const runCommand = async (options: CliOptions, host: Host, prompter?: Prompter): Promise<number> => {
  const hasTerminal = prompter !== undefined || stdin.isTTY;

  if (options.command === 'create') {
    say(`@linteljs/create ${packageJson.version}`);
  }

  try {
    const {
      name,
      answers,
      projects,
    } = await askedFrom(options, prompter ?? inquirerPrompter, hasTerminal, host);

    if (options.add !== undefined) {
      return await runAdd(options, answers, options.add);
    }

    if (options.command === 'sync') {
      return await runSync(options, answers, prompter ?? inquirerPrompter, hasTerminal);
    }

    if (options.existing && answers.layout === 'monorepo') {
      throw new Error(EXISTING_MONOREPO);
    }

    const projectName = name === '' ? await existingName(options.cwd) : name;
    const directory = unscopedName(name);

    await pipelineRun({
      name: projectName,
      cwd: options.existing ? options.cwd : resolve(options.cwd, directory),
      answers,
      ...(projects === undefined ? {} : { projects }),
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

// Not `process.exit`, which drops queued stderr writes.
export const main = async (argv: string[], prompter?: Prompter): Promise<number> => {
  const options = parsedOptions(argv);

  if (options === undefined) {
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

  return runCommand(options, host, prompter);
};
