import {
  isCancel,
  multiselect,
  type MultiSelectOptions,
  type Option,
  select,
  type SelectOptions,
  text,
  type TextOptions,
} from '@clack/prompts';
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

import {
  ANSWER_KEYS,
  RUN_CANCELLED_MESSAGE,
  STORE_CHOICES,
} from './constants';

import type {
  AnswerRecord,
  ChoiceRecord,
  MultiRecord,
  OptionalChoiceRecord,
  OptionalMultiRecord,
  ValueRecord,
} from '@answers/types';
import type { StoreSlot, TargetRecord } from '@targets/types';

/**
 * The four value-bearing kinds `askAnswer` dispatches on. `boolean` is `store` alone and is asked directly by the
 * loop, where `target.store`'s presence is proven by a type guard rather than assumed; `list` and `map` carry no
 * `prompt` on any of today's records, both being hand-edited only, so neither reaches `askAnswer` either.
 */
type PromptableRecord
  = ChoiceRecord
    | MultiRecord
    | OptionalChoiceRecord
    | OptionalMultiRecord;

/**
 * `@clack/prompts` is the one dependency this CLI carries: reading raw keypresses is not something `node:readline`
 * does. Fixed at `string` because `Option<Value>` only resolves its `label` for a primitive it can see at the call
 * site; `askChoice` and `askMulti` recover the literal union with the one cast the standard grants.
 */
export interface Prompter {
  select: (opts: SelectOptions<string>) => Promise<string | symbol>;
  multiselect: (opts: MultiSelectOptions<string>) => Promise<string[] | symbol>;
  text: (opts: TextOptions) => Promise<string | symbol>;
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

interface TargetWithStore extends TargetRecord {
  store: StoreSlot;
}

// The real terminal; tests substitute their own.
export const clackPrompter: Prompter = {
  select,
  multiselect,
  text,
  isCancel,
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
  const options: Option<string>[] = choices.map((choice) => {
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

const askStore = async (prompter: Prompter, slot: StoreSlot): Promise<boolean> => {
  const chosen = await askChoice(prompter, 'State store', [...STORE_CHOICES], 'none', (choice) => {
    return choice === 'none'
      ? {
          label: 'None',
          hint: "The framework's own state, and nothing installed",
        }
      : {
          label: slot.label,
          hint: `Installs ${slot.label} and gives it a place to live`,
        };
  });

  return chosen === 'store';
};

// `required` is clack's own gate on an empty submission. Filtering `choices` recovers `T` and fixes the answer's order.
const askMulti = async <T extends string>(
  prompter: Prompter,
  message: string,
  choices: readonly T[],
  initialValues: readonly T[],
  required: boolean,
  describe: (choice: T) => Described,
): Promise<T[]> => {
  const options: Option<string>[] = choices.map((choice) => {
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
    placeholder: 'my-app',
    validate: (value) => {
      return isValidProjectName(value ?? '') ? undefined : `must be ${PROJECT_NAME_RULE}`;
    },
  });

  return unwrap(prompter, answer);
};

// The values a record offers here, narrowed by `only` for this target: what a target never asks for is never shown.
const offeredValuesOf = <V extends string>(values: Record<V, ValueRecord>, target: TargetRecord): V[] => {
  return valuesOf(values).filter((value) => {
    return values[value].only === undefined || values[value].only(target);
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
): Promise<JsonValue | undefined> => {
  switch (record.kind) {
    case 'choice': {
      const offered = offeredValuesOf(record.values, target);

      return await askChoice(prompter, message, offered, record.default, describeFrom(record.values));
    }

    case 'optionalChoice': {
      const offered = ['none', ...offeredValuesOf(record.values, target)];
      const describeValue = describeFrom(record.values);
      const picked = await askChoice(prompter, message, offered, 'none', (choice) => {
        return choice === 'none' ? record.none : describeValue(choice);
      });

      return picked === 'none' ? undefined : picked;
    }

    case 'multi': {
      const offered = offeredValuesOf(record.values, target);

      return await askMulti(prompter, message, offered, record.default, false, describeFrom(record.values));
    }

    case 'optionalMulti': {
      const offered = offeredValuesOf(record.values, target);

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

const hasStore = (target: TargetRecord): target is TargetWithStore => {
  return target.store !== undefined;
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

  if (record.kind === 'boolean') {
    // The one boolean answer, `store`: a radio between the target's own slot and none, false where there is no
    // slot. `hasStore` stands in for `record.slot` here, so `target.store` narrows with no cast.
    return hasStore(target) ? await askStore(prompter, target.store) : false;
  }

  if (record.slot !== undefined && !record.slot(target)) {
    return unaskedValueOf(record);
  }

  if (record.askedWhen !== undefined && !record.askedWhen(soFarAnswered(answered))) {
    // Only `plugins` skips this way today: a multi, and a skip means none chosen, not the default three.
    return [];
  }

  // `list` and `map` carry no `prompt`, which the check above already refused; neither reaches `askAnswer`.
  return await askAnswer(prompter, record as PromptableRecord, message, target);
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
