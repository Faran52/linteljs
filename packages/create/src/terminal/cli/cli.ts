import {
  basename,
  join,
  resolve,
} from 'node:path';
import { stdin } from 'node:process';

import { projectDirectoryOf } from '@utils/answerUtils';
import { unscopedName } from '@utils/nameUtils';

import {
  ANSWERS,
  CONFIG_PATH,
  configOf,
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
import {
  packageAnswersOf,
  parsePackageJson,
} from '@emitters';
import {
  addProject,
  pipelineRun,
  planRootDependencies,
  planSync,
  syncAgentFiles,
  type SyncProject,
  syncWorkspaceOf,
} from '@pipeline';
import { runSpawn } from '@spawns';
import { targetFor } from '@targets';

import packageJson from '../../../package.json' with { type: 'json' };
import {
  filled,
  hosted,
  hostOf,
} from '../host/host';
import { NOTHING_ANSWERED_MESSAGE } from '../prompts/constants';
import {
  ask,
  askApp,
  type Asked,
  type AskedProject,
  inquirerPrompter,
  type Prompter,
  RunCancelled,
} from '../prompts/prompts';
import { isValidProjectName } from '../utils/nameUtils';

import {
  ADD_APP_NEEDS_ANSWERS,
  ADD_NEEDS_MONOREPO,
  EXISTING_MONOREPO,
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
} from './utils/reportUtils';
import {
  type Asker,
  dependencySteps,
  isSettled,
  lintConfigStep,
  switchRefusal,
  type SyncedProject,
} from './utils/syncStepUtils';

import type {
  Answers,
  Host,
  HostedAnswers,
  Workspace,
  WorkspaceProject,
} from '@config/types';

// `projects` for a monorepo, named for their directories; `answers` stays the first's.
interface HostedAsk {
  name: string;
  answers: HostedAnswers;
  projects?: Workspace['projects'];
  synced?: [SyncProject, ...SyncProject[]];
}

const EXIT_CANCELLED = 130;

const flaggedAnswers = (name: string, flags: AnswerFlags = {}): Answers => {
  const configText = JSON.stringify(configOf({
    ...DEFAULT_ANSWERS,
    // `none` fits every target; an unflagged answer takes the target's runner below.
    testing: 'none',
    ...flags,
  }, name));

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

    const syncOne = (project: LinteljsConfig['projects'][number]): SyncProject => {
      const answers = projectAnswersOf(config, project);
      const synced: SyncProject = {
        ...(project.name === undefined ? {} : { name: project.name }),
        answers: filled(answers, host),
      };

      return synced;
    };

    const [first, ...rest] = config.projects;
    const synced: HostedAsk = {
      ...fromConfig(config),
      synced: [syncOne(first), ...rest.map(syncOne)],
    };

    return synced;
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

// An app runs the questionnaire's App questions unless flags or `--yes` answer them.
const appAnswersOf = async (
  options: CliOptions,
  name: string,
  asker: Asker,
  host: Host,
): Promise<HostedAnswers> => {
  const isFlagged = asker.isYes || options.answers !== undefined;

  if (!isFlagged && !asker.hasTerminal) {
    throw new Error(ADD_APP_NEEDS_ANSWERS);
  }

  const flags = isFlagged ? options.answers : await askApp(asker.prompter, { layout: 'monorepo' });
  const answers = flaggedAnswers(name, {
    ...flags,
    layout: 'monorepo',
  });

  return hosted(answers, host);
};

// A project of the same name would give the workspace two packages under one name.
const runAdd = async (
  options: CliOptions,
  name: string,
  projects: [SyncProject, ...SyncProject[]],
  asker: Asker,
  host: Host,
): Promise<number> => {
  const { cwd, skip } = options;
  const [{ answers: first }] = projects;
  const binary = first.packageManager;

  if (first.layout !== 'monorepo') {
    console.error(ADD_NEEDS_MONOREPO);

    return 1;
  }

  const names = syncWorkspaceOf(cwd, projects).projects
    .map((project) => {
      return project.name;
    });
  const [taken] = globPaths(cwd, `{apps,packages}/${name}`);

  if (names.includes(name)) {
    console.error(`${name} is a project already: sync --add writes a new one.`);

    return 1;
  }

  if (taken !== undefined) {
    console.error(`${taken} exists: sync --add writes a new project.`);

    return 1;
  }

  const answers = options.kind === 'app' ? await appAnswersOf(options, name, asker, host) : packageAnswersOf(first);
  const written = await addProject(cwd, projects, {
    name,
    answers,
  });

  for (const target of written) {
    say(`wrote ${target}`);
  }

  if (skip.includes('install')) {
    say(`Install it:\n  ${binary} install`);

    return 0;
  }

  // The lockfile takes the project now, so the frozen install CI runs passes.
  say(`installing with ${binary}`);
  await runSpawn(binary, ['install'], cwd);

  return 0;
};

// Each project in config order, then the root's dependencies once.
const runSync = async (
  options: CliOptions,
  projects: [SyncProject, ...SyncProject[]],
  prompter: Prompter,
  hasTerminal: boolean,
): Promise<number> => {
  const { cwd } = options;
  const workspace = syncWorkspaceOf(cwd, projects);
  const synced = await Promise.all(workspace.projects
    .map(async ({ name, answers }) => {
      const directory = projectDirectoryOf(answers, name);
      const plan = await planSync(join(cwd, directory), answers);
      const project: SyncedProject = {
        directory,
        answers,
        plan,
      };

      return project;
    }));
  const refusal = await switchRefusal(cwd, synced);

  if (refusal !== undefined) {
    console.error(refusal);

    return 1;
  }

  const {
    written,
    removed,
    stale,
  } = await syncAgentFiles(cwd, workspace);

  for (const target of written) {
    say(`wrote ${target}`);
  }

  for (const target of removed) {
    say(`removed ${target}`);
  }

  for (const target of stale) {
    say(`stale ${target}: no project needs it now, so remove it unless it is yours`);
  }

  const [{ answers: first }] = workspace.projects;
  const root = first.layout === 'monorepo'
    ? await planRootDependencies(cwd, first)
    : {
        upgrades: [],
        peers: [],
      };
  const isCurrent = written.length === 0 && removed.length === 0 && isSettled(root) && synced
    .every(({ plan }) => {
      return isSettled(plan) && plan.eslintConfig.status === 'unchanged';
    });

  if (isCurrent) {
    say('Everything is already up to date.');
    return 0;
  }

  const asker: Asker = {
    isYes: options.yes,
    prompter,
    hasTerminal,
  };
  const blocked: boolean[] = [];

  for (const project of synced) {
    const dependencyBlocks = await dependencySteps(cwd, asker, project.directory, project.plan, first.packageManager);
    const isConfigBlocked = await lintConfigStep(cwd, asker, project);

    blocked.push(...dependencyBlocks, isConfigBlocked);
  }

  const rootBlocks = await dependencySteps(cwd, asker, '.', root, first.packageManager);

  blocked.push(...rootBlocks);

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
      synced,
    } = await askedFrom(options, prompter ?? inquirerPrompter, hasTerminal, host);

    if (synced !== undefined && options.add !== undefined) {
      const asker: Asker = {
        isYes: options.yes,
        prompter: prompter ?? inquirerPrompter,
        hasTerminal,
      };

      return await runAdd(options, options.add, synced, asker, host);
    }

    if (synced !== undefined) {
      return await runSync(options, synced, prompter ?? inquirerPrompter, hasTerminal);
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
