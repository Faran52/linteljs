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

import { DEFAULT_ANSWERS } from '../../model/answers/answers';

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
  // Svelte has neither a router nor a store slot, so this is name plus eight answers.
  it('asks the project name first, then returns the chosen answer for every question', async () => {
    const { result } = await askWith([
      'demo-app', 'svelte', 'none', 'bun', ['zod', 'tailwind'], undefined, 'relaxed', undefined, undefined,
    ]);

    expect(result).toEqual({
      name: 'demo-app',
      answers: {
        target: 'svelte',
        browser: 'chrome',
        testing: 'none',
        packageManager: 'bun',
        libraries: ['zod', 'tailwind'],
        store: false,
        typeSafety: 'relaxed',
        agents: ['claude-code'],
        plugins: ['ponytail', 'context7', 'frontend-design'],
      },
    });
  });

  // The extension target is the only one that hosts either axis; no store slot, so name plus nine answers.
  it('asks the browser and the UI framework for an extension, and records both', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'webextension', 'firefox', ['popup', 'background'], 'solid',
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.calls).toContain('Browser');
    expect(recorded.calls).toContain('UI framework');
    expect(result.answers.browser).toBe('firefox');
    expect(result.answers.hostedFramework).toBe('solid');
  });

  // `none` is a real answer, not a skipped question.
  it('records no hosted framework when the answer is none', async () => {
    const { result } = await askWith([
      'demo-app', 'webextension', 'chrome', ['popup', 'background'], 'none',
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result.answers.hostedFramework).toBeUndefined();
    expect(result.answers.browser).toBe('chrome');
  });

  // Recorded only where asked, so the eight other targets keep a config with no key for it.
  it('asks the surfaces for an extension, and records the ones chosen', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'webextension', 'firefox', ['devtools-panel'], 'solid',
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.calls).toContain('Surfaces');
    expect(result.answers.surfaces).toEqual(['devtools-panel']);
  });

  it('asks neither axis on a target that hosts neither', async () => {
    const { recorded } = await askWith([
      'demo-app', 'react', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.calls).not.toContain('Browser');
    expect(recorded.calls).not.toContain('UI framework');
    expect(recorded.calls).not.toContain('Surfaces');
  });

  // No language question on any target: this CLI generates TypeScript only. Angular has a store slot, so this is
  // name plus nine answers.
  it('asks nothing about the language, and still asks for a store', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'angular', undefined, undefined, undefined, undefined, 'store',
      undefined, undefined, undefined,
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

  // The input disappearing, not a person cancelling, partway through.
  it('throws once the script runs out, even partway through', async () => {
    const recorded = scripted(['demo-app']);

    await expect(ask(recorded.prompter)).rejects.toThrow(NOTHING_ANSWERED_MESSAGE);
  });

  // Cancelling is tagged by `code`, the way a filesystem error already is, and reachable partway through.
  it('throws a distinct, calm error when a person cancels mid-questionnaire', async () => {
    const recorded = scripted(['demo-app', CANCEL]);

    await expect(ask(recorded.prompter)).rejects.toMatchObject({
      message: RUN_CANCELLED_MESSAGE,
      code: 'CANCELLED',
    });
  });

  it('uses every default when each prompt is left blank', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result).toEqual({
      name: 'demo-app',
      answers: DEFAULT_ANSWERS,
    });
  });

  it('selects both agents and no plugins', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
      ['claude-code', 'codex'], [],
    ]);

    expect(result.answers).toMatchObject({
      agents: ['claude-code', 'codex'],
      plugins: [],
    });
  });

  it('selects one agent and a plugin subset, normalized to declaration order', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, ['codex'],
      ['frontend-design', 'ponytail'],
    ]);

    expect(result.answers).toMatchObject({
      agents: ['codex'],
      plugins: ['ponytail', 'frontend-design'],
    });
  });

  // What a person reads; none of these strings is the value written to `lintel.config.json`.
  it('offers every option in the product\'s own name and casing', async () => {
    const { recorded } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.labels).toMatchObject({
      'Testing': ['Vitest', 'None'],
      'Package manager': ['pnpm', 'npm', 'Yarn', 'Bun'],
      'Libraries': ['Zod', 'TanStack Query', 'Tailwind CSS', 'es-toolkit', 'ts-pattern', 't3-env'],
      'Form library': ['None', 'TanStack Form', 'React Hook Form'],
      'Router': ['None', 'React Router', 'TanStack Router'],
      'Type safety': ['Strict', 'Relaxed'],
      'AI agents': ['Claude Code', 'Codex', 'GitHub Copilot', 'Cursor'],
    });
  });

  it('skips the plugins question when no agent was chosen', async () => {
    const { result, recorded } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, [],
    ]);

    expect(result.answers).toMatchObject({
      agents: [],
      plugins: [],
    });
    expect(recorded.calls).not.toContain('AI plugins');
  });

  it('offers AI plugins label only when agents are selected', async () => {
    const { recorded } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, ['codex'],
      undefined,
    ]);

    expect(recorded.labels).toMatchObject({
      'AI plugins': ['Ponytail', 'Context7', 'Frontend Design'],
    });
  });

  describe('a name already resolved', () => {
    it('skips the name question and uses it as given', async () => {
      const { result, recorded } = await askWith(
        [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
        { name: 'from-flag' },
      );

      expect(result.name).toBe('from-flag');
      expect(recorded.calls).not.toContain('Project name');
    });
  });
});

describe('the store question', () => {
  // A radio, so a target that comes to offer two stores names both without the question changing kind.
  it('offers the target store and None, and takes the store', async () => {
    const { result, recorded } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined, undefined, 'store',
      undefined, undefined, undefined,
    ]);

    expect(result.answers.store).toBe(true);
    expect(recorded.calls[7]).toBe('State store');
    expect(recorded.labels['State store']).toEqual(['Zustand', 'None']);
  });

  it('names the store the target actually brings, not React\'s', async () => {
    const { recorded } = await askWith([
      'demo-app', 'angular', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
    ]);

    expect(recorded.labels['State store']).toEqual(['NgRx SignalStore', 'None']);
  });

  // None is a choice among the stores, and where the cursor starts.
  it('takes None as an answer of its own', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined, undefined, 'none',
      undefined, undefined, undefined,
    ]);

    expect(result.answers.store).toBe(false);
  });

  it('defaults to no store', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result.answers.store).toBe(false);
  });

  // Svelte's store is the framework's own runes.
  it('is not asked on a target without a store slot', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'svelte', undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result.answers.store).toBe(false);
    expect(recorded.calls.some((message) => {
      return message.includes('state store');
    })).toBe(false);
  });
});

// Refused at the prompt rather than by a scaffolder much later with a message about something else.
describe('the project name question', () => {
  it('refuses a name npm would not accept and passes one it would', async () => {
    const recorded = scripted([
      'my-app', undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined,
    ]);
    const seen: (string | undefined)[] = [];
    const prompter: Prompter = {
      ...recorded.prompter,
      text: (options: Parameters<Prompter['text']>[0]) => {
        // `undefined` is what clack passes before anything is typed.
        const validate = options.validate;

        // clack types `validate` as a function or a schema; a schema here would mean the question stopped validating.
        if (typeof validate !== 'function') {
          throw new TypeError('the project name question must validate with a function');
        }

        const r0 = validate(undefined);
        const r1 = validate('My-App');
        seen.push(
          typeof r0 === 'string' ? r0 : '',
          typeof r1 === 'string' ? r1 : '',
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

describe('the form library and router questions', () => {
  // Its own answer: the checkbox list carries the libraries and nothing else.
  it('records the form choice apart from the libraries', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, ['tailwind', 'zod'], 'react-hook-form',
      undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result.answers.libraries).toEqual(['zod', 'tailwind']);
    expect(result.answers.form).toBe('react-hook-form');
  });

  it('leaves form unset when none is chosen', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, ['zod'], 'none',
      undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(result.answers).not.toHaveProperty('form');
  });

  it('offers react-hook-form only where the target renders with React', async () => {
    const vue = await askWith([
      'demo-app', 'vue', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);
    const hostedReact = await askWith([
      'demo-app', 'astro', 'react', undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(vue.recorded.labels['Form library']).toEqual(['None', 'TanStack Form']);
    expect(hostedReact.recorded.labels['Form library']).toEqual(['None', 'TanStack Form', 'React Hook Form']);
  });

  it('asks for a router on React alone, and records the one chosen', async () => {
    const react = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined, 'tanstack-router',
      undefined, undefined, undefined, undefined,
    ]);
    const next = await askWith([
      'demo-app', 'next', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]);

    expect(react.result.answers.router).toBe('tanstack-router');
    expect(next.recorded.calls).not.toContain('Router');
    expect(next.result.answers).not.toHaveProperty('router');
  });
});
