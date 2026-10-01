import { NOTHING_ANSWERED_MESSAGE, type Prompter } from '@terminal';

export type ScriptedAnswer = string | readonly string[];

export interface Recorded {
  prompter: Prompter;
  calls: string[];
  labels: Record<string, string[]>;
}

interface PromptOption {
  label?: string;
  value: string;
}

export const CANCEL = Symbol('scripted-cancel');

export const scripted = (answers: readonly (ScriptedAnswer | typeof CANCEL | undefined)[]): Recorded => {
  const calls: string[] = [];
  const labels: Record<string, string[]> = {};
  let index = 0;

  const record = (message: string, options: PromptOption[]): void => {
    calls.push(message);

    labels[message] = options
      .map((option) => {
        return option.label ?? option.value;
      });
  };

  const next = (): ScriptedAnswer | typeof CANCEL | undefined => {
    if (index >= answers.length) {
      throw new Error(NOTHING_ANSWERED_MESSAGE);
    }

    const answer = answers[index];

    index += 1;

    return answer;
  };

  return {
    calls,
    labels,
    prompter: {
      select: (opts) => {
        record(opts.message, opts.options);

        const answer = next();

        if (answer === CANCEL) {
          return Promise.resolve(CANCEL);
        }

        const value = answer ?? opts.initialValue;

        return Promise.resolve(typeof value === 'string' ? value : CANCEL);
      },
      text: (opts) => {
        calls.push(opts.message);

        const answer = next();

        if (answer === CANCEL) {
          return Promise.resolve(CANCEL);
        }

        return Promise.resolve(typeof answer === 'string' ? answer : CANCEL);
      },
      multiselect: (opts) => {
        record(opts.message, opts.options);

        const answer = next();

        if (answer === CANCEL) {
          return Promise.resolve(CANCEL);
        }

        const value = answer ?? opts.initialValues;

        // Not `Array.isArray`: its `any[]` predicate widens the union and makes the spread unsafe.
        if (typeof value !== 'object') {
          return Promise.resolve(CANCEL);
        }

        if (opts.required && value.length === 0) {
          throw new Error(`${opts.message} needs at least one choice`);
        }

        return Promise.resolve([...value]);
      },
      isCancel: (value): value is symbol => {
        return value === CANCEL;
      },
    },
  };
};
