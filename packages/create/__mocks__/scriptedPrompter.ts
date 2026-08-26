import { NOTHING_ANSWERED_MESSAGE, type Prompter } from '../src/run/prompts/prompts';

/**
 * Every shape a scripted answer can take: a `select` or `text` answer is a string, a `multiselect` answer is a list of
 * strings, and `undefined` takes the prompt's own default. That is every value `ask` ever asks a prompter for, so the
 * mock never needs a wider type to carry a test's fixtures.
 */
export type ScriptedAnswer = string | readonly string[];

export interface Recorded {
  prompter: Prompter;
  // Every prompt's `message`, in the order `ask` asked them.
  calls: string[];
  /**
   * The option labels each `select`/`multiselect` offered, keyed by that prompt's message: what a person reads, which
   * is deliberately not what gets written to `lintel.config.json`. Recorded because a label is the only half of a
   * question with nothing else asserting it; the values are covered by the returned answers.
   */
  labels: Record<string, string[]>;
}

/**
 * Placed in a script to simulate a person cancelling that question on purpose, the way a real Ctrl+C resolves: every
 * prompt still ahead of it is never asked. Distinct from a script that simply runs out, which simulates the input
 * disappearing instead, and is a different problem `unwrap` tells apart by throwing directly rather than resolving.
 */
export const CANCEL = Symbol('scripted-cancel');

/**
 * A scripted terminal for `ask`.
 *
 * Each entry in `answers` is one prompt's answer, in the order `ask` asks them: `undefined` takes that prompt's own
 * default (`initialValue`/`initialValues`), exactly what leaving a real prompt alone and pressing Enter does, and
 * `CANCEL` resolves the way a real Ctrl+C would. A script shorter than the questionnaire runs out instead, and every
 * prompt from there on throws `NOTHING_ANSWERED_MESSAGE` directly, the same way a pipe with nobody left on the other
 * end would, so a test can drive either of `ask`'s two dead ends without a real terminal.
 */
export const scripted = (answers: readonly (ScriptedAnswer | typeof CANCEL | undefined)[]): Recorded => {
  const calls: string[] = [];
  const labels: Record<string, string[]> = {};
  let index = 0;

  const record = (message: string, options: { label?: string;
    value: string; }[]): void => {
    calls.push(message);
    labels[message] = options.map((option) => {
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

        const value = answer ?? opts.initialValue;

        return Promise.resolve(typeof value === 'string' ? value : CANCEL);
      },
      multiselect: (opts) => {
        record(opts.message, opts.options);

        const answer = next();

        if (answer === CANCEL) {
          return Promise.resolve(CANCEL);
        }

        const value = answer ?? opts.initialValues;

        /**
         * Not `Array.isArray`: its `arg is any[]` predicate widens every other member of the union away too, which
         * is what was turning the spread below into an unsafe one. An array is the only member of this union that
         * is `typeof 'object'`, so ruling everything else out that way keeps `value` typed as the array it already
         * is, with no cast.
         */
        if (typeof value !== 'object') {
          return Promise.resolve(CANCEL);
        }

        return Promise.resolve([...value]);
      },
      isCancel: (value): value is symbol => {
        return value === CANCEL;
      },
    },
  };
};
