import {
  checkbox,
  input,
  select,
} from '@inquirer/prompts';
import {
  CANCEL,
  type Recorded,
  scripted,
} from '@mocks/scriptedPrompter';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { NOTHING_ANSWERED_MESSAGE } from './constants';
import {
  ask,
  type Asked,
  type AskInput,
  inquirerPrompter,
  type Prompter,
  RunCancelled,
} from './prompts';

interface AskOutcome {
  result: Asked;
  recorded: Recorded;
}

vi.mock('@inquirer/prompts', () => {
  return {
    select: vi.fn(),
    checkbox: vi.fn(),
    input: vi.fn(),
  };
});

const askWith = async (
  answers: Parameters<typeof scripted>[0],
  input?: AskInput,
): Promise<AskOutcome> => {
  const recorded = scripted(answers);

  return {
    result: await ask(recorded.prompter, input),
    recorded,
  };
};

describe('ask', () => {
  it('asks the project name first, then returns the chosen answer for every question', async () => {
    const { result } = await askWith([
      'demo-app',
      'svelte',
      'none',
      ['zod'],
      'tailwind',
      undefined,
      'tanstack-store',
      undefined,
      undefined,
      [],
      'relaxed',
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result).toEqual({
      name: 'demo-app',
      answers: {
        target: 'svelte',
        browser: 'chrome',
        testing: 'none',
        packageManager: 'pnpm',
        libraries: ['zod'],
        styling: 'tailwind',
        store: 'tanstack-store',
        typeSafety: 'relaxed',
        agents: ['claude-code'],
        plugins: [
          'ponytail',
          'context7',
          'frontend-design',
        ],
      },
    });
  });

  it('asks the browser and the UI framework for an extension, and records both', async () => {
    const { result, recorded } = await askWith([
      'demo-app',
      'webextension',
      'firefox',
      ['popup', 'background'],
      'solid',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(recorded.calls).toContain('Browser');
    expect(recorded.calls).toContain('UI framework');
    expect(result.answers.browser).toBe('firefox');
    expect(result.answers.hostedFramework).toBe('solid');
  });

  it('records no hosted framework when the answer is none', async () => {
    const { result } = await askWith([
      'demo-app',
      'webextension',
      'chrome',
      ['popup', 'background'],
      'none',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result.answers.hostedFramework).toBeUndefined();
    expect(result.answers.browser).toBe('chrome');
  });

  it('asks the surfaces for an extension, and records the ones chosen', async () => {
    const { result, recorded } = await askWith([
      'demo-app',
      'webextension',
      'firefox',
      ['devtools-panel'],
      'solid',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(recorded.calls).toContain('Surfaces');
    expect(result.answers.surfaces).toEqual(['devtools-panel']);
  });

  it('will not take the surfaces question left untouched, which ticks none', async () => {
    const asked = askWith([
      'demo-app',
      'webextension',
      'firefox',
      undefined,
      'solid',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    await expect(asked).rejects.toThrow('Surfaces needs at least one choice');
  });

  it('asks neither axis on a target that hosts neither', async () => {
    const { recorded } = await askWith([
      'demo-app',
      'react',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(recorded.calls).not.toContain('Browser');
    expect(recorded.calls).not.toContain('UI framework');
    expect(recorded.calls).not.toContain('Surfaces');
  });

  it('asks nothing about the language, and still asks for a store', async () => {
    const { result, recorded } = await askWith([
      'demo-app',
      'angular',
      undefined,
      undefined,
      undefined,
      undefined,
      'ngrx-store',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result.answers.target).toBe('angular');
    expect(result.answers.store).toBe('ngrx-store');

    const mentionsTypescript = recorded.calls
      .some((message) => {
        return message.includes('typescript');
      });

    expect(mentionsTypescript).toBe(false);
  });

  it('throws before the first answer when the terminal is already gone', async () => {
    const recorded = scripted([]);

    await expect(ask(recorded.prompter)).rejects.toThrow(NOTHING_ANSWERED_MESSAGE);
  });

  it('throws once the script runs out, even partway through', async () => {
    const recorded = scripted(['demo-app']);

    await expect(ask(recorded.prompter)).rejects.toThrow(NOTHING_ANSWERED_MESSAGE);
  });

  it('throws a distinct, calm error when a person cancels mid-questionnaire', async () => {
    const recorded = scripted(['demo-app', CANCEL]);
    const asking = ask(recorded.prompter);

    await expect(asking).rejects.toBeInstanceOf(RunCancelled);
    await expect(asking).rejects.toThrow(new Error('Cancelled: nothing was written.'));
  });

  it('uses every default when each prompt is left blank', async () => {
    const { result } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result).toEqual({
      name: 'demo-app',
      answers: DEFAULT_ANSWERS,
    });
  });

  it.each<[string, string[], string[] | undefined]>([
    [
      'records nothing when no language is picked',
      [],
      undefined,
    ],
    [
      'records the languages picked',
      ['ar', 'ja'],
      ['ar', 'ja'],
    ],
  ])('%s', async (_label, picked, recorded) => {
    const { result } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      picked,
      undefined,
      ['claude-code'],
      [],
      undefined,
    ]);

    expect(result.answers.languages).toEqual(recorded);
  });

  it('selects both agents and no plugins', async () => {
    const { result } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ['claude-code', 'codex'],
      [],
      undefined,
    ]);

    expect(result.answers).toMatchObject({
      agents: ['claude-code', 'codex'],
      plugins: [],
    });
  });

  it('selects one agent and a plugin subset, normalized to declaration order', async () => {
    const { result } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ['codex'],
      ['frontend-design', 'ponytail'],
      undefined,
    ]);

    expect(result.answers).toMatchObject({
      agents: ['codex'],
      plugins: ['ponytail', 'frontend-design'],
    });
  });

  it('offers every option in the product\'s own name and casing', async () => {
    const { recorded } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(recorded.labels).toMatchObject({
      'Testing': ['Vitest', 'None'],
      'Libraries': [
        'Zod',
        'es-toolkit',
        'ts-pattern',
        't3-env',
      ],
      'Styling': [
        'None',
        'Tailwind CSS',
        'StyleX',
      ],
      'Data fetching': ['None', 'TanStack Query'],
      'Form library': [
        'None',
        'TanStack Form',
        'React Hook Form',
      ],
      'Router': [
        'None',
        'React Router',
        'React Router, framework mode',
        'TanStack Router',
      ],
      'Type safety': ['Strict', 'Relaxed'],
      'AI agents': [
        'Claude Code',
        'Codex',
        'GitHub Copilot',
        'Cursor',
      ],
    });
  });

  it('skips the plugins question when no agent was chosen', async () => {
    const { result, recorded } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
    ]);

    expect(result.answers).toMatchObject({
      agents: [],
      plugins: [],
    });
    expect(recorded.calls).not.toContain('AI plugins');
  });

  it('offers AI plugins label only when agents are selected', async () => {
    const { recorded } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ['codex'],
      undefined,
      undefined,
    ]);

    expect(recorded.labels).toMatchObject({
      'AI plugins': [
        'Ponytail',
        'Context7',
        'Frontend Design',
      ],
    });
  });

  describe('a name already resolved', () => {
    it('skips the name question and uses it as given', async () => {
      const { result, recorded } = await askWith(
        [
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        ],
        { name: 'from-flag' },
      );

      expect(result.name).toBe('from-flag');
      expect(recorded.calls).not.toContain('Project name');
    });
  });
});

describe('the store question', () => {
  it('offers every store the target has, and takes the one chosen', async () => {
    const { result, recorded } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'redux-toolkit',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result.answers.store).toBe('redux-toolkit');
    expect(recorded.calls[7]).toBe('State store');
    expect(recorded.labels['State store']).toEqual([
      'None',
      'Zustand',
      'Redux Toolkit',
      'TanStack Store',
    ]);
  });

  it('names the stores the target actually brings, not React\'s', async () => {
    const { recorded } = await askWith([
      'demo-app',
      'angular',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(recorded.labels['State store']).toEqual([
      'None',
      'NgRx SignalStore',
      'NgRx Store',
    ]);
  });

  it('takes None as an answer of its own', async () => {
    const { result } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'none',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result.answers.store).toBeUndefined();
  });

  it('defaults to no store', async () => {
    const { result } = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result.answers.store).toBeUndefined();
  });

  it('is not asked on a target without a store slot', async () => {
    const { result, recorded } = await askWith([
      'demo-app',
      'webextension',
      undefined,
      ['popup'],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result.answers.store).toBeUndefined();
    expect(recorded.calls).not.toContain('State store');
  });
});

describe('the project name question', () => {
  it('refuses a name npm would not accept and passes one it would', async () => {
    const recorded = scripted([
      'my-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    const seen: (string | undefined)[] = [];
    const prompter: Prompter = {
      ...recorded.prompter,
      text: (options: Parameters<Prompter['text']>[0]) => {
        const { validate } = options;

        seen.push(
          validate('') ?? '',
          validate('My-App') ?? '',
          validate('my-app'),
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
  it('records the form choice apart from the libraries', async () => {
    const { result } = await askWith([
      'demo-app',
      undefined,
      undefined,
      ['zod'],
      'tailwind',
      'react-hook-form',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result.answers.libraries).toEqual(['zod']);
    expect(result.answers.styling).toBe('tailwind');
    expect(result.answers.form).toBe('react-hook-form');
  });

  it('leaves form unset when none is chosen', async () => {
    const { result } = await askWith([
      'demo-app',
      undefined,
      undefined,
      ['zod'],
      undefined,
      'none',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(result.answers).not.toHaveProperty('form');
  });

  it('offers react-hook-form only where the target renders with React', async () => {
    const vue = await askWith([
      'demo-app',
      'vue',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    const hostedReact = await askWith([
      'demo-app',
      'astro',
      'react',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(vue.recorded.labels['Form library']).toEqual(['None', 'TanStack Form']);
    expect(hostedReact.recorded.labels['Form library']).toEqual([
      'None',
      'TanStack Form',
      'React Hook Form',
    ]);
  });

  it.each(['next', 'react-native'])('offers react-hook-form on %s', async (target) => {
    const { recorded } = await askWith([
      'demo-app',
      target,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(recorded.labels['Form library']).toEqual([
      'None',
      'TanStack Form',
      'React Hook Form',
    ]);
  });

  it('asks for a router on React alone, and records the one chosen', async () => {
    const react = await askWith([
      'demo-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'tanstack-router',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    const next = await askWith([
      'demo-app',
      'next',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);

    expect(react.result.answers.router).toBe('tanstack-router');
    expect(next.recorded.calls).not.toContain('Router');
    expect(next.result.answers).not.toHaveProperty('router');
  });
});

describe('inquirerPrompter', () => {
  beforeEach(() => {
    vi.mocked(select).mockReset();
    vi.mocked(checkbox).mockReset();
    vi.mocked(input).mockReset();
  });

  it('asks a choice as a select, with the label shown and the hint beside it', async () => {
    vi.mocked(select).mockResolvedValue('react');

    const answer = await inquirerPrompter.select({
      message: 'Framework',
      initialValue: 'react',
      options: [
        {
          value: 'react',
          label: 'React (Vite)',
          hint: 'the default',
        },
        {
          value: 'vue',
          label: 'Vue',
        },
      ],
    });

    expect(answer).toBe('react');
    expect(vi.mocked(select).mock.calls[0]?.[0]).toStrictEqual({
      message: 'Framework',
      default: 'react',
      pageSize: 2,
      choices: [
        {
          value: 'react',
          name: 'React (Vite)',
          description: 'the default',
        },
        {
          value: 'vue',
          name: 'Vue',
        },
      ],
    });
  });

  it('asks a multi as a checkbox, ticking what the record defaults to', async () => {
    vi.mocked(checkbox).mockResolvedValue(['zod']);

    const answer = await inquirerPrompter.multiselect({
      message: 'Libraries',
      initialValues: ['zod'],
      required: false,
      options: [
        {
          value: 'zod',
          label: 'Zod',
          hint: 'Schemas that narrow',
        },
        {
          value: 'tailwind',
          label: 'Tailwind CSS',
        },
      ],
    });

    expect(answer).toEqual(['zod']);
    expect(vi.mocked(checkbox).mock.calls[0]?.[0]).toStrictEqual({
      message: 'Libraries',
      required: false,
      pageSize: 2,
      choices: [
        {
          value: 'zod',
          name: 'Zod',
          description: 'Schemas that narrow',
          checked: true,
        },
        {
          value: 'tailwind',
          name: 'Tailwind CSS',
          checked: false,
        },
      ],
    });
  });

  it('asks the name as an input, translating what its validation answers', async () => {
    vi.mocked(input).mockResolvedValue('my-app');

    const answer = await inquirerPrompter.text({
      message: 'Project name',
      validate: (value) => {
        return value === 'my-app' ? undefined : 'must be a name';
      },
    });

    expect(answer).toBe('my-app');

    const asked = vi.mocked(input).mock.calls[0]?.[0];

    expect(asked?.message).toBe('Project name');
    expect(asked?.validate?.('my-app')).toBe(true);
    expect(asked?.validate?.('My-App')).toBe('must be a name');
  });

  it('answers the cancel symbol when the question is exited', async () => {
    vi.mocked(input).mockRejectedValue(Object.assign(new Error('User force closed the prompt'), {
      name: 'ExitPromptError',
    }));

    const answer = await inquirerPrompter.text({
      message: 'Project name',
      validate: () => {
        return undefined;
      },
    });

    expect(inquirerPrompter.isCancel(answer)).toBe(true);
  });

  it('rethrows anything that is not an exit', async () => {
    vi.mocked(select).mockRejectedValue(new Error('stdin is not a terminal'));

    const selected = inquirerPrompter.select({
      message: 'Framework',
      initialValue: 'react',
      options: [],
    });

    await expect(selected).rejects.toThrow('stdin is not a terminal');
  });

  it('knows a value from the cancel symbol', () => {
    expect(inquirerPrompter.isCancel('react')).toBe(false);
    expect(inquirerPrompter.isCancel(['zod'])).toBe(false);
  });
});
