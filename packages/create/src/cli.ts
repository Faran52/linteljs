import { resolve } from 'node:path';
import {
  parseArgs,
  type ParseArgsOptionDescriptor,
  type ParseArgsOptionsConfig,
} from 'node:util';

import { unscopedName } from '@utils/nameUtils';

import { workspaceAssemble } from '@assemble/assemble/workspace/workspaceAssemble';
import { WriteFailed } from '@assemble/errors/write-failed/writeFailedError';
import { answersCheck } from '@choices/check/answers/answersCheck';
import { Refused } from '@choices/errors/refused/refusedError';
import { catalogReader } from '@choices/read/catalog/catalogReader';
import {
  type Answered,
  manifestReader,
  type Question,
} from '@choices/read/manifest/manifestReader';
import { safeProjectPath, TEMPLATES_ROOT } from '@disk';
import { FRAMEWORKS } from '@frameworks/registry';
import { questionsAsk } from '@prompt/ask/questions/questionsAsk';
import { Cancelled } from '@prompt/errors/cancelled/cancelledError';
import {
  hostOf,
  inquirerPrompter,
  isValidProjectName,
  main as terminalMain,
  type Prompter,
} from '@terminal';

export interface Seams {
  frameworks?: readonly string[];
  root?: string;
  cwd?: string;
}

interface Run {
  name: string;
  target: string;
  yes: boolean;
  given: Answered;
  questions: readonly Question[];
  prompter: Prompter;
  root: string;
  cwd: string;
}

// SIGINT's exit code: a cancel is not a failure.
const EXIT_CANCELLED = 130;

const optionsOf = (questions: readonly Question[]): ParseArgsOptionsConfig => {
  const flags = questions
    .map((question) => {
      const option: ParseArgsOptionDescriptor = {
        type: 'string',
        multiple: question.kind === 'multi',
      };
      const entry: [string, ParseArgsOptionDescriptor] = [question.flag, option];

      return entry;
    });
  const options: ParseArgsOptionsConfig = {
    ...Object.fromEntries(flags),
    yes: {
      type: 'boolean',
      short: 'y',
    },
  };

  return options;
};

const givenOf = (questions: readonly Question[], values: ReturnType<typeof parseArgs>['values']): Answered => {
  const given: Answered = {};

  for (const question of questions) {
    const value = values[question.flag];

    if (typeof value === 'string') {
      given[question.key] = value;
    }

    if (Array.isArray(value)) {
      given[question.key] = value
        .filter((item) => {
          return typeof item === 'string';
        })
        .flatMap((item) => {
          return item.split(',');
        })
        .filter((item) => {
          return item !== '';
        });
    }
  }

  return given;
};

const created = async (run: Run): Promise<void> => {
  const host = await hostOf(run.cwd);

  if (typeof host === 'string') {
    throw new Refused(host);
  }

  if (!isValidProjectName(run.name)) {
    throw new Refused(`${run.name} is not a valid project name.`);
  }

  const directory = await safeProjectPath(run.cwd, unscopedName(run.name));
  const catalog = await catalogReader(run.questions, run.root, run.target);
  const asked = run.yes ? run.given : await questionsAsk(run.prompter, run.questions, catalog, run.given);
  const answers = answersCheck(run.questions, catalog, asked);

  await workspaceAssemble({
    root: run.root,
    cwd: directory,
    name: run.name,
    host,
    questions: run.questions,
    projects: [{
      name: run.name,
      answers,
    }],
  });
};

const exitCodeOf = (error: unknown): number => {
  if (error instanceof Cancelled) {
    console.warn(error.message);

    return EXIT_CANCELLED;
  }

  if (error instanceof Refused || error instanceof WriteFailed) {
    console.error(error.message);

    return 1;
  }

  console.error(String(error));

  return 1;
};

// A `--target` naming a framework module takes the rewrite; anything else, or an undeclared flag, the old pipeline.
export const main = async (
  argv: string[],
  prompter?: Prompter,
  {
    frameworks = FRAMEWORKS,
    root = TEMPLATES_ROOT,
    cwd = resolve(),
  }: Seams = {},
): Promise<number> => {
  const questions = await manifestReader();
  const options = optionsOf(questions);
  const {
    values,
    positionals,
    tokens,
  } = parseArgs({
    args: argv,
    options,
    strict: false,
    allowPositionals: true,
    tokens: true,
  });
  const [name, ...rest] = positionals;
  const { target, yes } = values;
  const framework = frameworks
    .find((each) => {
      return each === target;
    });
  const stray = tokens
    .some((token) => {
      if (token.kind !== 'option') {
        return false;
      }

      const option = options[token.name];

      return option === undefined || (option.type === 'boolean') !== (token.value === undefined);
    });
  const projectName = rest.length > 0 || stray ? undefined : name;

  if (framework === undefined || projectName === undefined || projectName === 'sync') {
    return terminalMain(argv, prompter);
  }

  const run: Run = {
    name: projectName,
    target: framework,
    yes: yes === true,
    given: givenOf(questions, values),
    questions,
    // The old pipeline reads an absent prompter as "check for a terminal"; step 2 brings that check here.
    prompter: prompter ?? inquirerPrompter,
    root,
    cwd,
  };

  try {
    await created(run);

    return 0;
  }
  catch (error) {
    return exitCodeOf(error);
  }
};
