import {
  CANCEL,
  type Recorded,
  scripted,
} from '@mocks/scriptedPrompter';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS, PLUGINS } from '../../model/answers/answers';

import {
  ask,
  type Asked,
  type AskInput,
  NOTHING_ANSWERED_MESSAGE,
  type Prompter,
  RUN_CANCELLED_MESSAGE,
} from './prompts';

const askWith = async (
  answers: Parameters<typeof scripted>[0],
  input?: AskInput,
): Promise<{ result: Asked;
  recorded: Recorded; }> => {
  const recorded = scripted(answers);

  return {
    result: await ask(recorded.prompter, input),
    recorded,
  };
};

describe('ask', () => {
  // Svelte has no store slot, so this is name plus seven answers for seven questions, not eight.
  it('asks the project name first, then returns the chosen answer for every question', async () => {
    const { result } = await askWith([
      'demo-app', 'svelte', 'none', 'bun', ['zod', 'tailwind'], 'relaxed', undefined, undefined,
    ]);

    expect(result).toEqual({
      name: 'demo-app',
      answers: {
        target: 'svelte',
        // Svelte hosts neither axis, so both questions are skipped and the browser keeps its default.
        browser: 'chrome',
        testing: 'none',
        packageManager: 'bun',
        libraries: ['zod', 'tailwind'],
        store: false,
        typeSafety: 'relaxed',
        agents: ['claude-code'],
        plugins: [...PLUGINS],
      },
    });
  });

  /**
   * The extension target is the only one that hosts either axis, so it is the only one asked. `webextension` has no
   * store slot, so this is name plus nine answers: target, browser, UI framework, testing, manager, libraries, type
   * safety, agents, plugins.
   */
  it('asks the browser and the UI framework for an extension, and records both', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'webextension', 'firefox', ['popup', 'background'], 'solid',
      undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.calls).toContain('Browser');
    expect(recorded.calls).toContain('UI framework');
    expect(result.answers.browser).toBe('firefox');
    expect(result.answers.hostedFramework).toBe('solid');
  });

  // `none` is a real answer, not a skipped question: an extension without a framework is the default shape.
  it('records no hosted framework when the answer is none', async () => {
    const { result } = await askWith([
      'demo-app', 'webextension', 'chrome', ['popup', 'background'], 'none',
      undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result.answers.hostedFramework).toBeUndefined();
    expect(result.answers.browser).toBe('chrome');
  });

  /**
   * The surfaces answer is recorded only where it was asked, so the eight non-extension targets keep a config with no
   * key for it rather than one naming a pair that means nothing to them.
   */
  it('asks the surfaces for an extension, and records the ones chosen', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'webextension', 'firefox', ['devtools-panel'], 'solid',
      undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.calls).toContain('Surfaces');
    expect(result.answers.surfaces).toEqual(['devtools-panel']);
  });

  it('asks neither axis on a target that hosts neither', async () => {
    const { recorded } = await askWith([
      'demo-app', 'react', undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.calls).not.toContain('Browser');
    expect(recorded.calls).not.toContain('UI framework');
    expect(recorded.calls).not.toContain('Surfaces');
  });

  // No language question on any target: this CLI generates TypeScript only. Angular does have a store slot, unlike
  // svelte above, so this is name plus eight answers.
  it('asks nothing about the language, and still asks for a store', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'angular', undefined, undefined, undefined, 'store', undefined, undefined, undefined,
    ]);

    expect(result.answers.target).toBe('angular');
    expect(result.answers.store).toBe(true);
    expect(recorded.calls.some((message) => {
      return message.includes('typescript');
    })).toBe(false);
  });

  it('throws before the first answer when the terminal is already gone', async () => {
    const recorded = scripted([]);

    await expect(ask(recorded.prompter)).rejects.toThrow(NOTHING_ANSWERED_MESSAGE);
  });

  // One real answer, then the script runs out: the input disappearing, not a person cancelling, so this is still
  // `NOTHING_ANSWERED_MESSAGE`, proven reachable partway through rather than only on the first question.
  it('throws once the script runs out, even partway through', async () => {
    const recorded = scripted(['demo-app']);

    await expect(ask(recorded.prompter)).rejects.toThrow(NOTHING_ANSWERED_MESSAGE);
  });

  /**
   * A person cancelling is a different problem from the terminal disappearing, and `unwrap` now tells them apart:
   * a calm, distinct message, tagged the way this codebase already tags a thrown error worth telling apart
   * (`'code' in error`), reachable partway through rather than only on the first question.
   */
  it('throws a distinct, calm error when a person cancels mid-questionnaire', async () => {
    const recorded = scripted(['demo-app', CANCEL]);

    await expect(ask(recorded.prompter)).rejects.toMatchObject({
      message: RUN_CANCELLED_MESSAGE,
      code: 'CANCELLED',
    });
  });

  it('uses every default when each prompt is left blank', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result).toEqual({
      name: 'demo-app',
      answers: DEFAULT_ANSWERS,
    });
  });

  it('selects both agents and no plugins', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined, undefined,
      ['claude-code', 'codex'], [],
    ]);

    expect(result.answers).toMatchObject({
      agents: ['claude-code', 'codex'],
      plugins: [],
    });
  });

  it('selects one agent and a plugin subset, normalized to declaration order', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined, undefined, ['codex'],
      ['frontend-design', 'ponytail'],
    ]);

    expect(result.answers).toMatchObject({
      agents: ['codex'],
      plugins: ['ponytail', 'frontend-design'],
    });
  });

  /**
   * The one thing about a question a person reads and nothing else asserts. Every product is spelled the way its own
   * documentation spells it, and none of these strings is the value written to `lintel.config.json`: the answers
   * asserted above are `tanstack-query`, `claude-code`, `ponytail`, and they must stay that way.
   */
  it('offers every option in the product\'s own name and casing', async () => {
    const { recorded } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.labels).toMatchObject({
      'Testing': ['Vitest', 'None'],
      'Package manager': ['pnpm', 'npm', 'Yarn', 'Bun'],
      'Libraries': ['Zod', 'TanStack Query', 'Tailwind CSS'],
      'Type safety': ['Strict', 'Relaxed'],
      'AI agents': ['Claude Code', 'Codex'],
      'AI plugins': ['Ponytail', 'Context7', 'Frontend Design'],
    });
  });

  describe('a name already resolved', () => {
    it('skips the name question and uses it as given', async () => {
      const { result, recorded } = await askWith(
        [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
        { name: 'from-flag' },
      );

      expect(result.name).toBe('from-flag');
      expect(recorded.calls).not.toContain('Project name');
    });
  });
});

describe('the store question', () => {
  // A radio over the target's own store and None, not a yes/no: the store is named as an option rather than in the
  // message, which is what lets a target that comes to offer two name both without the question changing kind.
  it('offers the target store and None, and takes the store', async () => {
    const { result, recorded } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, 'store', undefined, undefined, undefined,
    ]);

    expect(result.answers.store).toBe(true);
    expect(recorded.calls[5]).toBe('State store');
    expect(recorded.labels['State store']).toEqual(['Zustand', 'None']);
  });

  it('names the store the target actually brings, not React\'s', async () => {
    const { recorded } = await askWith([
      'demo-app', 'angular', undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.labels['State store']).toEqual(['NgRx SignalStore', 'None']);
  });

  // Only one store is installable at a time, so None is a choice among the stores rather than the absence of a yes,
  // and it is where the cursor starts.
  it('takes None as an answer of its own', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, 'none', undefined, undefined, undefined,
    ]);

    expect(result.answers.store).toBe(false);
  });

  it('defaults to no store', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result.answers.store).toBe(false);
  });

  // Svelte's store is the framework's own runes, so there is nothing to choose and no question.
  it('is not asked on a target without a store slot', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'svelte', undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result.answers.store).toBe(false);
    expect(recorded.calls.some((message) => {
      return message.includes('state store');
    })).toBe(false);
  });
});

// The question carries its own rule so a bad name is refused at the prompt, rather than surviving to a scaffolder
// that fails on it much later with a message about something else.
describe('the project name question', () => {
  it('refuses a name npm would not accept and passes one it would', async () => {
    const recorded = scripted([
      'my-app', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);
    const seen: (string | undefined)[] = [];
    const prompter: Prompter = {
      ...recorded.prompter,
      text: (options: Parameters<Prompter['text']>[0]) => {
        // `undefined` is what clack passes before anything is typed, and an empty name is no more valid than a
        // malformed one.
        const validate = options.validate;

        // clack types `validate` as a function or a schema. The question passes a function, and a schema here would
        // mean the question stopped validating, so failing loudly beats quietly asserting the shape.
        if (typeof validate !== 'function') {
          throw new TypeError('the project name question must validate with a function');
        }

        seen.push(
          String(validate(undefined) ?? ''),
          String(validate('My-App') ?? ''),
          validate('my-app') === undefined ? undefined : 'unexpected',
        );

        return recorded.prompter.text(options);
      },
    };

    const result = await ask(prompter);

    expect(seen[0]).toContain('must be');
    expect(seen[1]).toContain('must be');
    expect(seen[2]).toBeUndefined();
    expect(result.name).toBe('my-app');
  });
});
