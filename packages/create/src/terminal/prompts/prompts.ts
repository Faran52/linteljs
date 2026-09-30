import {
  checkbox,
  input,
  select,
} from '@inquirer/prompts';
import { omit } from 'es-toolkit';

import { valuesOf } from '@utils/objectUtils';

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
  unaskedValueOf,
  type ValueRecord,
} from '@answers';
import { targetFor, type TargetRecord } from '@targets';

import { PROJECT_NAME_RULE } from '../constants';
import { isValidProjectName } from '../utils/nameUtils';

import { ANSWER_KEYS, RUN_CANCELLED_MESSAGE } from './constants';

import type { Answers } from '@config/types';

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
}

export interface Asked {
  name: string;
  answers: Answers;
}

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
      // The default window is seven, which hid the last two frameworks behind a scroll.
      pageSize: Math.max(options.length, 1),
      choices: options
        .map((option) => {
          return {
            value: option.value,
            name: option.label,
            ...(option.hint === undefined ? {} : { description: option.hint }),
          };
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
          return {
            value: option.value,
            name: option.label,
            ...(option.hint === undefined ? {} : { description: option.hint }),
            checked: initialValues.includes(option.value),
          };
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
      return {
        value: choice,
        ...describe(choice),
      };
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
      return {
        value: choice,
        ...describe(choice),
      };
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
  return valuesOf(values)
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
): Promise<JsonValue | undefined> => {
  switch (record.kind) {
    case 'choice': {
      const offered = offeredValuesOf(record.values, target, answered);

      return await askChoice(prompter, message, offered, record.default, describeFrom(record.values));
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

      return await askMulti(prompter, message, offered, record.default, false, describeFrom(record.values));
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
  return {
    ...DEFAULT_ANSWERS,
    ...answered,
  } as Answers;
};

// `targetFor` is recomputed per call, so `hostedFramework` reaches the builders by the time `form` reads it.
const askIfNeeded = async (
  prompter: Prompter,
  answered: Partial<Record<AnswerKey, JsonValue>>,
  key: AnswerKey,
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
  return await askAnswer(prompter, record as PromptableRecord, message, target, soFar);
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

// Through `parseLinteljsConfig`, the flag gate, so nothing `refuseMisfit` refuses is offered and no cast is needed.
export const ask = async (prompter: Prompter, input: AskInput = {}): Promise<Asked> => {
  const name = input.name ?? await askName(prompter);
  const answered: Partial<Record<AnswerKey, JsonValue>> = {};

  for (const key of ANSWER_KEYS) {
    writeIfPresent(answered, key, await askIfNeeded(prompter, answered, key));
  }

  const config = parseLinteljsConfig(JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...DEFAULT_ANSWERS,
    ...answered,
  }));

  return {
    name,
    answers: omit(config, ['$schema', 'schemaVersion']),
  };
};
