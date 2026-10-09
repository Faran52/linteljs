import {
  checkbox,
  input,
  select,
} from '@inquirer/prompts';
import { omit, pick } from 'es-toolkit';

import { keysOf } from '@utils/objectUtils';

import {
  type AnswerKey,
  type AnswerRecord,
  ANSWERS,
  type ChoiceRecord,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  type JsonValue,
  type MultiRecord,
  type OptionalChoiceRecord,
  type OptionalMultiRecord,
  parseLinteljsConfig,
  projectAnswersOf,
  unaskedValueOf,
  type ValueRecord,
  WORKSPACE_KEYS,
  workspaceConfigOf,
} from '@answers';
import { targetFor, type TargetRecord } from '@targets';

import { PROJECT_DIR_NAME_RULE, PROJECT_NAME_RULE } from '../constants';
import { isValidProjectDirName, isValidProjectName } from '../utils/nameUtils';

import {
  ANSWER_KEYS,
  MAX_PROJECTS,
  PROJECT_KEYS,
  PROJECT_KINDS,
  RUN_CANCELLED_MESSAGE,
} from './constants';

import type { Answers, ProjectConfig } from '@config/types';

// `list` and `map` carry no `prompt`, so neither reaches `askAnswer`.
type PromptableRecord
  = ChoiceRecord
    | MultiRecord
    | OptionalChoiceRecord
    | OptionalMultiRecord;

export interface PromptOption {
  value: string;
  label: string;
  hint?: string;
}

export interface SelectRequest {
  message: string;
  initialValue: string;
  options: PromptOption[];
}

export interface MultiSelectRequest {
  message: string;
  initialValues: string[];
  required: boolean;
  options: PromptOption[];
}

export interface TextRequest {
  message: string;
  validate: (value: string) => string | undefined;
}

// `string` because a question's values are only a union at the call site.
export interface Prompter {
  select: (request: SelectRequest) => Promise<string | symbol>;
  multiselect: (request: MultiSelectRequest) => Promise<string[] | symbol>;
  text: (request: TextRequest) => Promise<string | symbol>;
  isCancel: (value: string | readonly string[] | symbol) => value is symbol;
}

export interface AskInput {
  name?: string | undefined;
  fixed?: Partial<Record<AnswerKey, JsonValue>>;
}

export interface AskedProject {
  name: string;
  answers: Answers;
}

export interface Asked {
  name: string;
  projects: [AskedProject, ...AskedProject[]];
}

type Answered = Partial<Record<AnswerKey, JsonValue>>;

type AnsweredEntry = readonly [Answered, string];

interface Described {
  label: string;
  hint?: string;
}

const CANCELLED = Symbol('cancelled');

// Its own class so `main` recognises a cancel by one `instanceof`.
export class RunCancelled extends Error {}

// Matched on the name: the error is constructed in `@inquirer/core`, a transitive dependency.
const cancellable = async <T>(asked: Promise<T>): Promise<T | symbol> => {
  try {
    return await asked;
  }
  catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      return CANCELLED;
    }

    throw error;
  }
};

export const inquirerPrompter: Prompter = {
  select: async ({
    message,
    initialValue,
    options,
  }) => {
    return await cancellable(select({
      message,
      default: initialValue,
      // The default window is seven, which hides the last two frameworks behind a scroll.
      pageSize: Math.max(options.length, 1),
      choices: options
        .map((option) => {
          const choice = {
            value: option.value,
            name: option.label,
            ...(option.hint === undefined ? {} : { description: option.hint }),
          };

          return choice;
        }),
    }));
  },
  multiselect: async ({
    message,
    initialValues,
    required,
    options,
  }) => {
    return await cancellable(checkbox({
      message,
      required,
      pageSize: Math.max(options.length, 1),
      choices: options
        .map((option) => {
          const choice = {
            value: option.value,
            name: option.label,
            ...(option.hint === undefined ? {} : { description: option.hint }),
            checked: initialValues.includes(option.value),
          };

          return choice;
        }),
    }));
  },
  text: async ({ message, validate }) => {
    return await cancellable(input({
      message,
      validate: (value) => {
        return validate(value) ?? true;
      },
    }));
  },
  isCancel: (value): value is symbol => {
    return value === CANCELLED;
  },
};

const unwrap = <T extends string | readonly string[]>(prompter: Prompter, value: T | symbol): T => {
  if (prompter.isCancel(value)) {
    throw new RunCancelled(RUN_CANCELLED_MESSAGE);
  }

  return value;
};

const askChoice = async <T extends string>(
  prompter: Prompter,
  message: string,
  choices: readonly T[],
  initialValue: T,
  describe: (choice: T) => Described,
): Promise<T> => {
  const options: PromptOption[] = choices
    .map((choice) => {
      const option: PromptOption = {
        value: choice,
        ...describe(choice),
      };

      return option;
    });

  const answer = await prompter.select({
    message,
    initialValue,
    options,
  });

  // The one cast the standard grants, onto the bare generic parameter.
  return unwrap(prompter, answer) as T;
};

const askMulti = async <T extends string>(
  prompter: Prompter,
  message: string,
  choices: readonly T[],
  initialValues: readonly T[],
  required: boolean,
  describe: (choice: T) => Described,
): Promise<T[]> => {
  const options: PromptOption[] = choices
    .map((choice) => {
      const option: PromptOption = {
        value: choice,
        ...describe(choice),
      };

      return option;
    });

  const answer = await prompter.multiselect({
    message,
    initialValues: [...initialValues],
    required,
    options,
  });

  const selected = unwrap(prompter, answer);

  return choices
    .filter((choice) => {
      return selected.includes(choice);
    });
};

const askName = async (prompter: Prompter): Promise<string> => {
  const answer = await prompter.text({
    message: 'Project name',
    validate: (value) => {
      return isValidProjectName(value) ? undefined : `must be ${PROJECT_NAME_RULE}`;
    },
  });

  return unwrap(prompter, answer);
};

// The parser refuses the same values through the same predicate.
const offeredValuesOf = <V extends string>(
  values: Record<V, ValueRecord>,
  target: TargetRecord,
  answered: Answers,
): V[] => {
  return keysOf(values)
    .filter((value) => {
      return values[value].only === undefined || values[value].only(target, answered);
    });
};

const describeFrom = <V extends string>(values: Record<V, ValueRecord>) => {
  return (value: V): Described => {
    return values[value];
  };
};

const askAnswer = async (
  prompter: Prompter,
  record: PromptableRecord,
  message: string,
  target: TargetRecord,
  answered: Answers,
  targets: readonly TargetRecord[] = [target],
): Promise<JsonValue | undefined> => {
  switch (record.kind) {
    case 'choice': {
      const offered = offeredValuesOf(record.values, target, answered);
      // React Native refuses the `vitest` default, so it starts on the first value it offers.
      const [first = record.default] = offered;
      const initial = offered.includes(record.default) ? record.default : first;

      return await askChoice(prompter, message, offered, initial, describeFrom(record.values));
    }

    case 'optionalChoice': {
      const offered = ['none', ...offeredValuesOf(record.values, target, answered)];
      const describeValue = describeFrom(record.values);
      const picked = await askChoice(prompter, message, offered, 'none', (choice) => {
        return choice === 'none' ? record.none : describeValue(choice);
      });

      return picked === 'none' ? undefined : picked;
    }

    case 'multi': {
      const offered = offeredValuesOf(record.values, target, answered);

      const preselected = record.targetDefault?.(targets) ?? record.default;

      return await askMulti(prompter, message, offered, preselected, false, describeFrom(record.values));
    }

    case 'optionalMulti': {
      const offered = offeredValuesOf(record.values, target, answered);

      // Required unless skippable: an extension with no surface has a manifest naming nothing.
      const required = record.skippable !== true;
      const picked = await askMulti(prompter, message, offered, [], required, describeFrom(record.values));

      // A required checkbox refuses an empty submit, so only a skippable answer comes back empty.
      return picked.length === 0 ? undefined : picked;
    }
  }
};

const soFarAnswered = (answered: Partial<Record<AnswerKey, JsonValue>>): Answers => {
  const answers = {
    ...DEFAULT_ANSWERS,
    ...answered,
  } as Answers;

  return answers;
};

// `targetFor` is recomputed per call, so `hostedFramework` reaches the builders by the time `form` reads it.
const askIfNeeded = async (
  prompter: Prompter,
  answered: Partial<Record<AnswerKey, JsonValue>>,
  key: AnswerKey,
  targets?: readonly TargetRecord[],
): Promise<JsonValue | undefined> => {
  const record: AnswerRecord = ANSWERS[key];

  if (record.prompt === undefined) {
    return undefined;
  }

  const message = record.prompt;
  const soFar = soFarAnswered(answered);
  const target = targetFor(soFar);

  if (record.slot !== undefined && !record.slot(target)) {
    return unaskedValueOf(record);
  }

  if (record.askedWhen !== undefined && !record.askedWhen(soFar)) {
    // A skip means none chosen, not the default three.
    return [];
  }

  // The check above already refused `list` and `map`.
  return await askAnswer(prompter, record as PromptableRecord, message, target, soFar, targets);
};

// `exactOptionalPropertyTypes` bans setting an optional property to `undefined`.
const writeIfPresent = (
  answered: Partial<Record<AnswerKey, JsonValue>>,
  key: AnswerKey,
  value: JsonValue | undefined,
): void => {
  if (value !== undefined) {
    answered[key] = value;
  }
};

export const confirm = async (prompter: Prompter, message: string): Promise<boolean> => {
  const picked = await prompter.select({
    message,
    initialValue: 'no',
    options: [
      {
        value: 'yes',
        label: 'Yes',
      },
      {
        value: 'no',
        label: 'No',
      },
    ],
  });
  const answer = unwrap(prompter, picked);

  return answer === 'yes';
};

const askKeys = async (
  prompter: Prompter,
  answered: Partial<Record<AnswerKey, JsonValue>>,
  keys: readonly AnswerKey[],
  targets?: readonly TargetRecord[],
): Promise<void> => {
  const open = keys
    .filter((key) => {
      return !Object.hasOwn(answered, key);
    });

  for (const key of open) {
    const value = await askIfNeeded(prompter, answered, key, targets);

    writeIfPresent(answered, key, value);
  }
};

const askCount = async (prompter: Prompter): Promise<number> => {
  const answer = await prompter.text({
    message: 'How many projects?',
    validate: (value) => {
      const count = Number(value);
      const isCount = /^[1-9]\d*$/v.test(value) && count <= MAX_PROJECTS;

      return isCount ? undefined : `must be a whole number from 1 to ${String(MAX_PROJECTS)}`;
    },
  });

  const count = Number(unwrap(prompter, answer));

  return count;
};

const askProjectName = async (
  prompter: Prompter,
  position: number,
  workspaceName: string,
  taken: readonly string[],
): Promise<string> => {
  const answer = await prompter.text({
    message: `Project ${String(position)} name`,
    validate: (value) => {
      return isValidProjectDirName(value, workspaceName, taken) ? undefined : `must be ${PROJECT_DIR_NAME_RULE}`;
    },
  });

  return unwrap(prompter, answer);
};

// The App questions, also asked by `sync --add --kind app`.
export const askApp = async (
  prompter: Prompter,
  workspace: Partial<Record<AnswerKey, JsonValue>>,
): Promise<Partial<Record<AnswerKey, JsonValue>>> => {
  const answered: Partial<Record<AnswerKey, JsonValue>> = { ...workspace };
  const appTarget: ChoiceRecord = {
    ...ANSWERS.target,
    values: omit(ANSWERS.target.values, ['typescript']),
  };
  const soFar = soFarAnswered(answered);

  const target = await askAnswer(prompter, appTarget, ANSWERS.target.prompt, targetFor(soFar), soFar);

  writeIfPresent(answered, 'target', target);
  await askKeys(prompter, answered, PROJECT_KEYS);

  return omit(answered, WORKSPACE_KEYS);
};

// An app picks a framework; a package is the TypeScript target on its defaults.
const askProject = async (
  prompter: Prompter,
  position: number,
  workspace: Partial<Record<AnswerKey, JsonValue>>,
): Promise<Partial<Record<AnswerKey, JsonValue>>> => {
  const kind = await askChoice(prompter, `Project ${String(position)} kind`, keysOf(PROJECT_KINDS), 'app', (choice) => {
    return PROJECT_KINDS[choice];
  });

  if (kind === 'package') {
    const typescript: Partial<Record<AnswerKey, JsonValue>> = { target: 'typescript' };

    return typescript;
  }

  return await askApp(prompter, workspace);
};

const parsedAsked = (name: string, entries: readonly AnsweredEntry[]): Asked => {
  const workspaceConfig = workspaceConfigOf(entries
    .map(([answered, projectName]) => {
      const entry = [{
        ...DEFAULT_ANSWERS,
        ...answered,
      }, projectName] as const;

      return entry;
    }));
  const config = parseLinteljsConfig(JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...workspaceConfig,
  }));

  // A single layout's one project goes unnamed and takes the repository's.
  const projectOf = (project: ProjectConfig): AskedProject => {
    const asked: AskedProject = {
      name: project.name ?? name,
      answers: projectAnswersOf(config, project),
    };

    return asked;
  };

  const [first, ...rest] = config.projects;
  const asked: Asked = {
    name,
    projects: [projectOf(first), ...rest.map(projectOf)],
  };

  return asked;
};

const askMonorepo = async (
  prompter: Prompter,
  name: string,
  workspace: Partial<Record<AnswerKey, JsonValue>>,
): Promise<Asked> => {
  const count = await askCount(prompter);
  const entries: AnsweredEntry[] = [];

  for (let position = 1; position <= count; position++) {
    const taken = entries
      .map(([, projectName]) => {
        return projectName;
      });
    const projectName = await askProjectName(prompter, position, name, taken);
    const project = await askProject(prompter, position, workspace);

    entries.push([project, projectName]);
  }

  const targets = entries
    .map(([project]) => {
      const soFar = soFarAnswered({
        ...workspace,
        ...project,
      });

      return targetFor(soFar);
    });
  const [[firstProject] = [{}]] = entries;
  const answered = {
    ...firstProject,
    ...workspace,
  };

  // Asked once, offering what any project offers.
  await askKeys(prompter, answered, WORKSPACE_KEYS, targets);

  const shared = pick(answered, WORKSPACE_KEYS);
  const projects = entries
    .map(([project, projectName]): AnsweredEntry => {
      const entry: AnsweredEntry = [{
        ...project,
        ...shared,
      }, projectName];

      return entry;
    });

  return parsedAsked(name, projects);
};

// Through `parseLinteljsConfig`, the flag gate, so nothing `refuseMisfit` refuses is offered and no cast is needed.
export const ask = async (prompter: Prompter, input: AskInput = {}): Promise<Asked> => {
  const name = input.name ?? await askName(prompter);
  const answered: Partial<Record<AnswerKey, JsonValue>> = { ...input.fixed };

  await askKeys(prompter, answered, ['layout']);

  if (answered.layout === 'monorepo') {
    return await askMonorepo(prompter, name, answered);
  }

  await askKeys(prompter, answered, ANSWER_KEYS);

  return parsedAsked(name, [[answered, name]]);
};
