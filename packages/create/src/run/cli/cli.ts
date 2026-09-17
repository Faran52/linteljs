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
import { parseArgs, type ParseArgsOptionsConfig } from 'node:util';

import packageJson from '../../../package.json' with { type: 'json' };
import { RUN_PREFIX } from '../../artifacts/build-scripts/buildScripts';
import {
  type Answers,
  DEFAULT_ANSWERS,
  isValidProjectName,
  PROJECT_NAME_RULE,
} from '../../model/answers/answers';
import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  parseLintelConfig,
  readLintelConfig,
} from '../../model/config/lintelConfig';
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
import { ensurePackageManager } from '../utils/commandUtils';
import { entryExists } from '../utils/fsUtils';

// Answers given as flags, validated by the config parser so a wrong value names its choices.
export interface AnswerFlags {
  target?: string;
  browser?: string;
  hostedFramework?: string;
  surfaces?: string[];
  testing?: string;
  packageManager?: string;
  libraries?: string[];
  form?: string;
  router?: string;
  store?: boolean;
  typeSafety?: string;
  agents?: string[];
  plugins?: string[];
}

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

// The answer flags as `parseArgs` hands them over, before the config parser checks the values.
interface RawAnswerFlags {
  'target'?: string;
  'browser'?: string;
  'hosted'?: string;
  'surfaces'?: string[];
  'testing'?: string;
  'pm'?: string;
  'libraries'?: string[];
  'form'?: string;
  'router'?: string;
  'store'?: boolean;
  'type-safety'?: string;
  'agents'?: string[];
  'plugins'?: string[];
}

// stdout for what the user asked to see; `console.error` for failures.
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
  --version, -v
  --help, -h

Answers, for a run that asks nothing (unset ones take the defaults):
  --target <id>         react, next, vue, svelte, solid, angular, astro, webextension, react-native
  --pm <name>           pnpm, npm, yarn, bun
  --testing <choice>    vitest, none
  --type-safety <floor> strict, relaxed
  --libraries <list>    zod, tanstack-query, tailwind, es-toolkit, ts-pattern, t3-env
  --form <id>           tanstack-form, react-hook-form (react only)
  --router <id>         react-router, tanstack-router (react only)
  --store               install the target's state store
  --agents <list>       claude-code, codex, copilot, cursor
  --plugins <list>      ponytail, context7, frontend-design
  --browser <name>      chrome, firefox (webextension only)
  --hosted <framework>  react, vue, svelte, solid (webextension and astro only)
  --surfaces <list>     popup, background, devtools-panel (webextension only)
A list is comma-separated or the flag repeated.

A non-interactive create needs a project name, or --yes to take the directory's.
`;

const list = (flag: string[]): string[] => {
  return flag.flatMap((value) => {
    return value.split(',');
  });
};

const answerFlagsFrom = (values: RawAnswerFlags): AnswerFlags => {
  return {
    ...(values.target === undefined ? {} : { target: values.target }),
    ...(values.browser === undefined ? {} : { browser: values.browser }),
    ...(values.hosted === undefined ? {} : { hostedFramework: values.hosted }),
    ...(values.surfaces === undefined ? {} : { surfaces: list(values.surfaces) }),
    ...(values.testing === undefined ? {} : { testing: values.testing }),
    ...(values.pm === undefined ? {} : { packageManager: values.pm }),
    ...(values.libraries === undefined ? {} : { libraries: list(values.libraries) }),
    ...(values.form === undefined ? {} : { form: values.form }),
    ...(values.router === undefined ? {} : { router: values.router }),
    ...(values.store === true ? { store: true } : {}),
    ...(values['type-safety'] === undefined ? {} : { typeSafety: values['type-safety'] }),
    ...(values.agents === undefined ? {} : { agents: list(values.agents) }),
    ...(values.plugins === undefined ? {} : { plugins: list(values.plugins) }),
  };
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
  'target': { type: 'string' },
  'pm': { type: 'string' },
  'testing': { type: 'string' },
  'type-safety': { type: 'string' },
  'libraries': {
    type: 'string',
    multiple: true,
  },
  'form': { type: 'string' },
  'router': { type: 'string' },
  'store': {
    type: 'boolean',
    default: false,
  },
  'agents': {
    type: 'string',
    multiple: true,
  },
  'plugins': {
    type: 'string',
    multiple: true,
  },
  'browser': { type: 'string' },
  'hosted': { type: 'string' },
  'surfaces': {
    type: 'string',
    multiple: true,
  },
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
  return parseLintelConfig(JSON.stringify({
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
    return named(await readLintelConfig(options.cwd));
  }

  if (options.skip.includes('scaffold') && await entryExists(join(options.cwd, CONFIG_PATH))) {
    return named(await readLintelConfig(options.cwd));
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
