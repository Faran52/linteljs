import {
  checkbox,
  input,
  select,
} from '@inquirer/prompts';
import { omit } from 'es-toolkit';

import { valuesOf } from '@utils/objectUtils';

import {
  type AnswerKey,
  ANSWERS,
  type Answers,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  parseLinteljsConfig,
} from '@answers';
import { type JsonValue, unaskedValueOf } from '@answers/utils/readUtils';
import { targetFor } from '@targets';

import { PROJECT_NAME_RULE } from '../constants';
import { isValidProjectName } from '../utils/nameUtils';

import { ANSWER_KEYS, RUN_CANCELLED_MESSAGE } from './constants';

import type {
  AnswerRecord,
  ChoiceRecord,
  MultiRecord,
  OptionalChoiceRecord,
  OptionalMultiRecord,
  ValueRecord,
} from '@answers/types';
import type { TargetRecord } from '@targets/types';

/**
 * The four value-bearing kinds `askAnswer` dispatches on, which is now every kind a record can be asked in: `store`
 * was the one `boolean` and became an optional choice when it grew past yes-or-no. `list` and `map` carry no
 * `prompt` on any of today's records, both being hand-edited only, so neither reaches `askAnswer` either.
 */
type PromptableRecord
  = ChoiceRecord
    | MultiRecord
    | OptionalChoiceRecord
    | OptionalMultiRecord;

// What a question offers: the value written to the config, and the two display halves a person reads.
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
  // The message to show instead of accepting the value, or `undefined` where it is acceptable.
  validate: (value: string) => string | undefined;
}

/**
 * The questionnaire's own vocabulary rather than its library's, so the library is one file's business. Fixed at
 * `string` because a question's values are only a union at the call site; `askChoice` and `askMulti` recover the
 * literal union with the one cast the standard grants.
 */
export interface Prompter {
  select: (request: SelectRequest) => Promise<string | symbol>;
  multiselect: (request: MultiSelectRequest) => Promise<string[] | symbol>;
  text: (request: TextRequest) => Promise<string | symbol>;
  // Ctrl+C resolves a cancel symbol instead of a value; `unwrap` tells the two apart with this.
  isCancel: (value: string | readonly string[] | symbol) => value is symbol;
}

export interface AskInput {
  // Already known (argument or directory name): the question is not asked.
  name?: string | undefined;
}

export interface Asked {
  name: string;
  answers: Answers;
}

// Display only: the persisted value is never the label or the hint.
interface Described {
  label: string;
  hint?: string;
}

const CANCELLED = Symbol('cancelled');

/**
 * `@inquirer/prompts` rejects with an `ExitPromptError` on Ctrl+C where this interface resolves a symbol, so the
 * throw is turned back into one here. Matched on the name rather than the class: the error is constructed inside
 * `@inquirer/core`, which is a transitive dependency and not ours to import.
 */
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

// The real terminal; tests substitute their own.
export const inquirerPrompter: Prompter = {
  select: async ({
    message,
    initialValue,
    options,
  }) => {
    return await cancellable(select({
      message,
      default: initialValue,
      // Every option on screen: the default window is seven, which hid the last two frameworks behind a scroll.
      pageSize: Math.max(options.length, 1),
      choices: options.map((option) => {
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
      choices: options.map((option) => {
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
    throw Object.assign(new Error(RUN_CANCELLED_MESSAGE), { code: 'CANCELLED' });
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
  const options: PromptOption[] = choices.map((choice) => {
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

  // `Prompter` erases every choice to `string`; a cast onto the bare generic parameter is the one the standard grants.
  return unwrap(prompter, answer) as T;
};

// `required` is the prompt's own gate on an empty submission. Filtering `choices` recovers `T` and fixes
// the answer's order.
const askMulti = async <T extends string>(
  prompter: Prompter,
  message: string,
  choices: readonly T[],
  initialValues: readonly T[],
  required: boolean,
  describe: (choice: T) => Described,
): Promise<T[]> => {
  const options: PromptOption[] = choices.map((choice) => {
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

  return choices.filter((choice) => {
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

/**
 * The values a record offers here, narrowed by `only`: what a target never asks for is never shown, and neither is
 * what another answer has already ruled out. `rtk-query` is the second case, being legal only with the Redux store
 * that ships it, and the parser refuses the same value through the same predicate.
 */
const offeredValuesOf = <V extends string>(
  values: Record<V, ValueRecord>,
  target: TargetRecord,
  answered: Answers,
): V[] => {
  return valuesOf(values).filter((value) => {
    return values[value].only === undefined || values[value].only(target, answered);
  });
};

// A record's own values, described the way `askChoice`/`askMulti` want: both already carry `label` and `hint`.
const describeFrom = <V extends string>(values: Record<V, ValueRecord>) => {
  return (value: V): Described => {
    return values[value];
  };
};

const askAnswer = async (
  prompter: Prompter,
  record: PromptableRecord,
  // Already checked by the caller: only a record with a `prompt` reaches here.
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

      return await askMulti(prompter, message, offered, [], false, describeFrom(record.values));
    }
  }
};

// The `Answers` slot-and-askedWhen checks want, folding what has been answered so far over the defaults.
const soFarAnswered = (answered: Partial<Record<AnswerKey, JsonValue>>): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...answered,
  } as Answers;
};

/**
 * One record's worth of the questionnaire: `undefined` when its own `prompt` is absent, the unasked value when a
 * `slot` or an `askedWhen` refuses it for the target and the answers so far, and what was asked otherwise.
 * `targetFor` is recomputed on every call, which is what lets `hostedFramework` reach the Astro and extension
 * builders by the time `form` reads `target.framework`.
 */
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
  const target = targetFor(soFarAnswered(answered));

  if (record.slot !== undefined && !record.slot(target)) {
    return unaskedValueOf(record);
  }

  if (record.askedWhen !== undefined && !record.askedWhen(soFarAnswered(answered))) {
    // Only `plugins` skips this way today: a multi, and a skip means none chosen, not the default three.
    return [];
  }

  // `list` and `map` carry no `prompt`, which the check above already refused; neither reaches `askAnswer`.
  return await askAnswer(prompter, record as PromptableRecord, message, target, soFarAnswered(answered));
};

// `undefined` means omitted, not written: `exactOptionalPropertyTypes` bans setting an optional property to it.
const writeIfPresent = (
  answered: Partial<Record<AnswerKey, JsonValue>>,
  key: AnswerKey,
  value: JsonValue | undefined,
): void => {
  if (value !== undefined) {
    answered[key] = value;
  }
};

/**
 * In insertion order: project name, then every record `askIfNeeded` has an answer for.
 *
 * Accumulates into a plain object and hands it to `parseLinteljsConfig`, the same gate a `--flag` answer passes
 * through, so the questionnaire can offer nothing `refuseMisfit` would refuse and needs no cast onto `Answers`.
 */
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

  // The envelope belongs to the file, not the answers a caller asked for.
  return {
    name,
    answers: omit(config, ['$schema', 'schemaVersion']),
  };
};
