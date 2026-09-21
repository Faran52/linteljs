import { stdout } from 'node:process';
// The real one, reached under its other name: `node:readline/promises` is mocked below, and this is the same
// factory, so a suite can build a genuine interface to hand back through the mock.
import { promises as realReadline } from 'node:readline';
import { createInterface, type Interface } from 'node:readline/promises';
import { Readable, Writable } from 'node:stream';

import {
  CANCEL_SYMBOL,
  multiselect,
  select,
} from '@clack/prompts';
import {
  CANCEL,
  type Recorded,
  scripted,
} from '@mocks/scriptedPrompter';
import {
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { NOTHING_ANSWERED_MESSAGE, RUN_CANCELLED_MESSAGE } from './constants';
import {
  ask,
  type Asked,
  type AskInput,
  clackPrompter,
  type Prompter,
} from './prompts';

interface AskOutcome {
  result: Asked;
  recorded: Recorded;
}

// A stubbed question and the interface it belongs to, which the interrupt case needs to emit on.
interface Asking {
  interface: Interface;
  question: MockInstance<Interface['question']>;
}

vi.mock('node:readline/promises', () => {
  return { createInterface: vi.fn() };
});

vi.mock('@clack/prompts', () => {
  return {
    select: vi.fn(),
    multiselect: vi.fn(),
    text: vi.fn(),
    isCancel: vi.fn(),
    updateSettings: vi.fn(),
    CANCEL_SYMBOL: Symbol('clack-cancel'),
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
  // Svelte has neither a router nor a store slot, so this is name plus eight answers.
  it('asks the project name first, then returns the chosen answer for every question', async () => {
    const { result } = await askWith([
      'demo-app', 'svelte', 'none', ['zod', 'tailwind'], undefined, 'relaxed', undefined, undefined]);

    expect(result).toEqual({
      name: 'demo-app',
      answers: {
        target: 'svelte',
        browser: 'chrome',
        testing: 'none',
        // Never asked: the questionnaire leaves the record's placeholder, which `cli.ts` overwrites with the host.
        packageManager: 'pnpm',
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
      undefined, undefined, undefined, undefined, undefined, undefined]);

    expect(recorded.calls).toContain('Browser');
    expect(recorded.calls).toContain('UI framework');
    expect(result.answers.browser).toBe('firefox');
    expect(result.answers.hostedFramework).toBe('solid');
  });

  // `none` is a real answer, not a skipped question.
  it('records no hosted framework when the answer is none', async () => {
    const { result } = await askWith([
      'demo-app', 'webextension', 'chrome', ['popup', 'background'], 'none',
      undefined, undefined, undefined, undefined, undefined, undefined]);

    expect(result.answers.hostedFramework).toBeUndefined();
    expect(result.answers.browser).toBe('chrome');
  });

  // Recorded only where asked, so the eight other targets keep a config with no key for it.
  it('asks the surfaces for an extension, and records the ones chosen', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'webextension', 'firefox', ['devtools-panel'], 'solid',
      undefined, undefined, undefined, undefined, undefined, undefined]);

    expect(recorded.calls).toContain('Surfaces');
    expect(result.answers.surfaces).toEqual(['devtools-panel']);
  });

  it('asks neither axis on a target that hosts neither', async () => {
    const { recorded } = await askWith([
      'demo-app', 'react', undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined]);

    expect(recorded.calls).not.toContain('Browser');
    expect(recorded.calls).not.toContain('UI framework');
    expect(recorded.calls).not.toContain('Surfaces');
  });

  // No language question on any target: this CLI generates TypeScript only. Angular has a store slot, so this is
  // name plus nine answers.
  it('asks nothing about the language, and still asks for a store', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'angular', undefined, undefined, undefined, 'store',
      undefined, undefined, undefined]);

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
      'demo-app', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined]);

    expect(result).toEqual({
      name: 'demo-app',
      answers: DEFAULT_ANSWERS,
    });
  });

  it('selects both agents and no plugins', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
      ['claude-code', 'codex'], []]);

    expect(result.answers).toMatchObject({
      agents: ['claude-code', 'codex'],
      plugins: [],
    });
  });

  it('selects one agent and a plugin subset, normalized to declaration order', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, ['codex'],
      ['frontend-design', 'ponytail']]);

    expect(result.answers).toMatchObject({
      agents: ['codex'],
      plugins: ['ponytail', 'frontend-design'],
    });
  });

  // What a person reads; none of these strings is the value written to `linteljs.config.json`.
  it('offers every option in the product\'s own name and casing', async () => {
    const { recorded } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined]);

    expect(recorded.labels).toMatchObject({
      'Testing': ['Vitest', 'None'],
      'Libraries': ['Zod', 'TanStack Query', 'Tailwind CSS', 'es-toolkit', 'ts-pattern', 't3-env'],
      'Form library': ['None', 'TanStack Form', 'React Hook Form'],
      'Router': ['None', 'React Router', 'TanStack Router'],
      'Type safety': ['Strict', 'Relaxed'],
      'AI agents': ['Claude Code', 'Codex', 'GitHub Copilot', 'Cursor'],
    });
  });

  it('skips the plugins question when no agent was chosen', async () => {
    const { result, recorded } = await askWith([
      'demo-app', undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, []]);

    expect(result.answers).toMatchObject({
      agents: [],
      plugins: [],
    });
    expect(recorded.calls).not.toContain('AI plugins');
  });

  it('offers AI plugins label only when agents are selected', async () => {
    const { recorded } = await askWith([
      'demo-app', undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, ['codex'],
      undefined]);

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
      'demo-app', undefined, undefined, undefined, undefined, undefined, 'store',
      undefined, undefined, undefined]);

    expect(result.answers.store).toBe(true);
    expect(recorded.calls[6]).toBe('State store');
    expect(recorded.labels['State store']).toEqual(['Zustand', 'None']);
  });

  it('names the store the target actually brings, not React\'s', async () => {
    const { recorded } = await askWith([
      'demo-app', 'angular', undefined, undefined, undefined,
      undefined, undefined, undefined, undefined]);

    expect(recorded.labels['State store']).toEqual(['NgRx SignalStore', 'None']);
  });

  // None is a choice among the stores, and where the cursor starts.
  it('takes None as an answer of its own', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, undefined, 'none',
      undefined, undefined, undefined]);

    expect(result.answers.store).toBe(false);
  });

  it('defaults to no store', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined]);

    expect(result.answers.store).toBe(false);
  });

  // Svelte's store is the framework's own runes.
  it('is not asked on a target without a store slot', async () => {
    const { result, recorded } = await askWith([
      'demo-app', 'svelte', undefined, undefined, undefined, undefined, undefined, undefined]);

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
      'my-app', undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined]);
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
      'demo-app', undefined, undefined, ['tailwind', 'zod'], 'react-hook-form',
      undefined, undefined, undefined, undefined, undefined]);

    expect(result.answers.libraries).toEqual(['zod', 'tailwind']);
    expect(result.answers.form).toBe('react-hook-form');
  });

  it('leaves form unset when none is chosen', async () => {
    const { result } = await askWith([
      'demo-app', undefined, undefined, ['zod'], 'none',
      undefined, undefined, undefined, undefined, undefined]);

    expect(result.answers).not.toHaveProperty('form');
  });

  it('offers react-hook-form only where the target renders with React', async () => {
    const vue = await askWith([
      'demo-app', 'vue', undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
    const hostedReact = await askWith([
      'demo-app', 'astro', 'react', undefined, undefined, undefined, undefined, undefined, undefined]);

    expect(vue.recorded.labels['Form library']).toEqual(['None', 'TanStack Form']);
    expect(hostedReact.recorded.labels['Form library']).toEqual(['None', 'TanStack Form', 'React Hook Form']);
  });

  // Their own `framework` values, and both render with React; asking for the exact `react` left them out.
  it.each(['next', 'react-native'])('offers react-hook-form on %s', async (target) => {
    const { recorded } = await askWith([
      'demo-app', target, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined]);

    expect(recorded.labels['Form library']).toEqual(['None', 'TanStack Form', 'React Hook Form']);
  });

  it('asks for a router on React alone, and records the one chosen', async () => {
    const react = await askWith([
      'demo-app', undefined, undefined, undefined, undefined, 'tanstack-router',
      undefined, undefined, undefined, undefined]);
    const next = await askWith([
      'demo-app', 'next', undefined, undefined, undefined, undefined, undefined, undefined, undefined]);

    expect(react.result.answers.router).toBe('tanstack-router');
    expect(next.recorded.calls).not.toContain('Router');
    expect(next.result.answers).not.toHaveProperty('router');
  });
});

/**
 * The one place the real terminal is spoken to. Everything above drives `ask` through a scripted `Prompter`; this is
 * the other side of that seam, and the only thing holding what a person reads to what clack is handed.
 */
describe('clackPrompter', () => {
  const outputOf = (spy: typeof multiselect | typeof select): Writable => {
    const { output } = vi.mocked(spy).mock.calls[0]?.[0] ?? {};

    if (output === undefined) {
      throw new Error('the prompt was handed no output stream');
    }

    return output;
  };

  const writtenBy = (frames: string[], through?: Writable): string[] => {
    const seen: string[] = [];
    const writing = vi.spyOn(stdout, 'write').mockImplementation((chunk) => {
      seen.push(String(chunk));

      return true;
    });

    try {
      for (const frame of frames) {
        through?.write(frame);
      }
    }
    finally {
      writing.mockRestore();
    }

    return seen;
  };

  it('joins a submitted question to its answer, under the mark a finished stage carries', async () => {
    vi.mocked(select).mockResolvedValue('test-app');

    await clackPrompter.select({
      message: 'Project name',
      initialValue: 'test-app',
      options: [],
    });

    // Measured: clack writes a submitted prompt as one chunk, and every frame before it starts with another symbol.
    expect(writtenBy([
      '\u25C7  Project name\ntest-app',
      '\u25C6  Framework\n\u25CF React\n',
    ], outputOf(select))).toEqual([
      '\u2713  Project name  test-app',
      '\u25C6  Framework\n\u25CF React\n',
    ]);
  });

  it('gives the stream the terminal it writes to, rather than clack falling back to 80', async () => {
    vi.mocked(multiselect).mockResolvedValue(['zod']);

    await clackPrompter.multiselect({
      message: 'Libraries',
      initialValues: [],
      required: false,
      options: [],
    });

    expect(outputOf(multiselect)).toHaveProperty('columns', stdout.columns);
    expect(outputOf(multiselect)).toHaveProperty('isTTY', true);
  });

  /**
   * The name is the one question asked as a line of text rather than a list, and the one clack draws over two lines
   * whatever the guide says. These hold what a person sees: the answer on the line they typed it on.
   */
  describe('the name question', () => {
    /**
     * A real `Interface` over streams that go nowhere, with its `question` stubbed. Built rather than shaped: the
     * type carries far more than this needs, and a partial one would have to be cast into place.
     */
    const asked = (answers: string[]): Asking => {
      const asking = realReadline.createInterface({
        input: new Readable({
          read: () => {
            return undefined;
          },
        }),
        output: new Writable({
          write: (_chunk, _encoding, done) => {
            done();
          },
        }),
      });
      const question = vi.spyOn(asking, 'question');

      for (const answer of answers) {
        question.mockResolvedValueOnce(answer);
      }

      vi.mocked(createInterface).mockReturnValue(asking);

      return {
        interface: asking,
        question,
      };
    };

    it('asks on one line and rewrites that line with the answer', async () => {
      const { question } = asked(['my-app']);
      const printed = writtenBy([]);

      const answer = await clackPrompter.text({
        message: 'Project name',
        validate: () => {
          return undefined;
        },
      });

      expect(answer).toBe('my-app');
      expect(question).toHaveBeenCalledWith('\u25C6  Project name  ');
      expect(printed).toEqual([]);
    });

    it('rewrites the line it was typed on, in place', async () => {
      asked(['my-app']);

      const seen: string[] = [];
      const writing = vi.spyOn(stdout, 'write').mockImplementation((chunk) => {
        seen.push(String(chunk));

        return true;
      });

      await clackPrompter.text({
        message: 'Project name',
        validate: () => {
          return undefined;
        },
      });

      writing.mockRestore();

      // Up one line, clear it, back to column one: the question and its answer end up where the question was.
      expect(seen).toEqual(['\u001B[1A\u001B[2K\u001B[G\u2713  Project name  my-app\n']);
    });

    // `validate` is optional on the request, and a question with none accepts whatever was typed.
    it('accepts a question with nothing to validate', async () => {
      asked(['my-app']);

      const writing = vi.spyOn(stdout, 'write').mockImplementation(() => {
        return true;
      });

      try {
        expect(await clackPrompter.text({ message: 'Project name' })).toBe('my-app');
      }
      finally {
        writing.mockRestore();
      }
    });

    // Ctrl+C on a readline question is its own event, and has to come back as the symbol clack would have returned.
    it('answers the cancel symbol when the question is interrupted', async () => {
      const { interface: asking, question } = asked([]);

      question.mockImplementation(async () => {
        asking.emit('SIGINT');

        return await Promise.resolve('');
      });

      expect(await clackPrompter.text({
        message: 'Project name',
        validate: () => {
          return undefined;
        },
      })).toBe(CANCEL_SYMBOL);
    });

    // Measured: readline reports Ctrl+D as an abort rather than an answer, and the run is cancelled either way.
    it('answers the cancel symbol when the input ends', async () => {
      const { question } = asked([]);

      question.mockRejectedValueOnce(Object.assign(new Error('Aborted with Ctrl+D'), { name: 'AbortError' }));

      expect(await clackPrompter.text({
        message: 'Project name',
        validate: () => {
          return undefined;
        },
      })).toBe(CANCEL_SYMBOL);
    });

    it('lets anything else through', async () => {
      const { question } = asked([]);

      question.mockRejectedValueOnce(new Error('the terminal went away'));

      await expect(clackPrompter.text({
        message: 'Project name',
        validate: () => {
          return undefined;
        },
      })).rejects.toThrow('the terminal went away');
    });

    it('says why a name was refused and asks again', async () => {
      const { question } = asked(['My-App', 'my-app']);

      const seen: string[] = [];
      const writing = vi.spyOn(stdout, 'write').mockImplementation((chunk) => {
        seen.push(String(chunk));

        return true;
      });

      const answer = await clackPrompter.text({
        message: 'Project name',
        validate: (value) => {
          return value === 'my-app' ? undefined : 'must be lowercase';
        },
      });

      writing.mockRestore();

      expect(answer).toBe('my-app');
      expect(question).toHaveBeenCalledTimes(2);
      expect(seen[0]).toBe('   must be lowercase\n');
    });
  });
});
