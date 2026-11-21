import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  badgeOf,
  contextOf,
  contextWarningOf,
  elapsedOf,
  mainBadgesOf,
  mainContextOf,
  modelBadgeOf,
  modelNameOf,
  subagentRowsOf,
  subagentTranscriptOf,
  tokensFromEnv,
  transcriptModelOf,
} from './contextUtils.ts';

import type { SessionInput } from './hostUtils.ts';

// Hoisted above the import, so the limits a session exports cannot move the module's defaults.
vi.hoisted(() => {
  vi.stubEnv('CONTEXT_WARN_TOKENS', undefined);
  vi.stubEnv('CONTEXT_CEILING_TOKENS', undefined);
});

const assistant = (input: number, read: number, created: number): string => {
  return JSON.stringify({
    type: 'assistant',
    message: {
      usage: {
        input_tokens: input,
        cache_read_input_tokens: read,
        cache_creation_input_tokens: created,
        output_tokens: 999,
      },
    },
  });
};

let directory: string;

const transcriptOf = (lines: string[], name = 'main.jsonl'): string => {
  const path = join(directory, name);
  writeFileSync(path, `${lines.join('\n')}\n`);
  return path;
};

beforeEach(() => {
  const prefix = join(tmpdir(), 'linteljs-context-');
  directory = mkdtempSync(prefix);
});

afterEach(() => {
  rmSync(directory, {
    recursive: true,
    force: true,
  });
});

describe('contextOf', () => {
  it('sums the last assistant entry\'s input, cache read and cache creation', () => {
    const path = transcriptOf([
      assistant(1, 2, 3),
      assistant(10, 140_000, 5000),
      JSON.stringify({ type: 'user', message: { usage: { input_tokens: 7 } } }),
      '{"type":"assistant"',
    ]);

    const tokens = contextOf(path);

    expect(tokens).toBe(145_010);
  });

  it('skips an assistant entry with no usage and counts a missing key as zero', () => {
    const path = transcriptOf([
      JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 42, cache_read_input_tokens: 'x' } } }),
      JSON.stringify({ type: 'assistant', message: {} }),
      JSON.stringify({ type: 'assistant' }),
      'null',
    ]);

    const tokens = contextOf(path);

    expect(tokens).toBe(42);
  });

  it('skips an assistant entry whose usage is no object', () => {
    const path = transcriptOf([
      assistant(5, 0, 0),
      JSON.stringify({ type: 'assistant', message: { usage: 'x' } }),
    ]);

    const tokens = contextOf(path);

    expect(tokens).toBe(5);
  });

  it('closes the transcript it reads', () => {
    const path = transcriptOf([assistant(1, 0, 0)]);

    const nextDescriptor = (): number => {
      const descriptor = openSync(path, 'r');
      closeSync(descriptor);
      return descriptor;
    };

    const before = nextDescriptor();
    contextOf(path);
    const after = nextDescriptor();

    expect(after).toBe(before);
  });

  it('answers zero for a missing file or one with no assistant entry', () => {
    const empty = transcriptOf([JSON.stringify({ type: 'user' })]);

    const context = contextOf(join(directory, 'missing.jsonl'));
    expect(context).toBe(0);
    const emptyContext = contextOf(empty);
    expect(emptyContext).toBe(0);
    const directoryContext = contextOf(directory);
    expect(directoryContext).toBe(0);
  });

  // A small tail keeps the fixtures small.
  const tailBytes = 200;

  it('reads only the tail, so an entry further back is not seen', () => {
    const filler = JSON.stringify({ type: 'user', text: 'x'.repeat(tailBytes) });
    const path = transcriptOf([assistant(1, 0, 0), filler]);

    const tokens = contextOf(path, tailBytes);

    expect(tokens).toBe(0);
  });

  it('reads an entry that ends exactly at the tail', () => {
    const line = assistant(5, 0, 0);
    const filler = JSON.stringify({ type: 'user', text: 'x'.repeat(tailBytes - line.length - 40) });
    const path = transcriptOf([filler, line]);

    const tokens = contextOf(path, tailBytes);

    expect(tokens).toBe(5);
  });
});

it('finds a subagent\'s transcript beside the main one', () => {
  const path = subagentTranscriptOf('/p/session.jsonl', 'a1b2');

  expect(path).toBe(join('/p/session', 'subagents', 'agent-a1b2.jsonl'));
});

it('strips only the transcript\'s own extension', () => {
  const path = subagentTranscriptOf('/p/old.jsonl/session.jsonl', 'a1b2');
  const expected = join('/p/old.jsonl/session', 'subagents', 'agent-a1b2.jsonl');
  expect(path).toBe(expected);
});

describe('badgeOf', () => {
  it.each([
    [
      0,
      108,
      '[CTX 0K]',
    ],
    [
      129_999,
      108,
      '[CTX 129K]',
    ],
    [
      130_000,
      173,
      '[CTX 130K]',
    ],
    [
      149_999,
      173,
      '[CTX 149K]',
    ],
    [
      150_000,
      167,
      '[CTX 150K]',
    ],
    [
      270_400,
      167,
      '[CTX 270K]',
    ],
  ])('shows %i tokens in colour %i as %s', (tokens, colour, text) => {
    const badge = badgeOf(tokens);

    expect(badge).toBe(`\u001B[38;5;${String(colour)}m${text}\u001B[0m`);
  });
});

describe('tokensFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['300000', 300_000],
    ['', 7],
    ['0', 7],
    ['1.5', 7],
    ['many', 7],
  ])('reads %s as %s', (value, tokens) => {
    vi.stubEnv('LINTELJS_TOKENS', value);

    const read = tokensFromEnv('LINTELJS_TOKENS', 7);

    expect(read).toBe(tokens);
  });
});

describe('elapsedOf', () => {
  it('prints minutes under an hour, hours and minutes after, and never below zero', () => {
    const underAMinute = elapsedOf(59_999);
    expect(underAMinute).toBe('0m');
    const minutes = elapsedOf(12 * 60_000);
    expect(minutes).toBe('12m');
    const hours = elapsedOf(125 * 60_000);
    expect(hours).toBe('2h 5m');
    const negative = elapsedOf(-5);
    expect(negative).toBe('0m');
  });
});

const modelEntry = (model: string): string => {
  return JSON.stringify({ type: 'assistant', message: { model } });
};

describe('modelNameOf', () => {
  it.each([
    ['claude-opus-5-5', 'OPUS 5.5'],
    ['claude-fable-5-1[1m]', 'FABLE 5.1'],
    ['claude-haiku-4-5-20251001', 'HAIKU 4.5'],
    ['claude-sonnet-4-20250514', 'SONNET 4'],
    ['<synthetic>', undefined],
    [undefined, undefined],
  ])('names %s as %s', (id, name) => {
    const named = modelNameOf(id);
    expect(named).toBe(name);
  });
});

describe('transcriptModelOf', () => {
  it('names the last assistant entry\'s model, past synthetic entries', () => {
    const path = transcriptOf([
      modelEntry('claude-sonnet-5-5'),
      modelEntry('claude-opus-5-5'),
      modelEntry('<synthetic>'),
    ]);

    const model = transcriptModelOf(path);

    expect(model).toBe('OPUS 5.5');
  });

  it('names nothing for a missing transcript', () => {
    const model = transcriptModelOf(join(directory, 'missing.jsonl'));
    expect(model).toBeUndefined();
  });
});

describe('mainBadgesOf', () => {
  it('puts the model badge after the context badge, from the payload or else the transcript', () => {
    const path = transcriptOf([modelEntry('claude-haiku-5-5')]);

    const reported = mainBadgesOf({ model: { id: 'claude-opus-5-5' }, context_window: { total_input_tokens: 5 } });
    expect(reported).toBe(`${badgeOf(5)} ${modelBadgeOf('OPUS 5.5')}`);
    const read = mainBadgesOf({ transcript_path: path, context_window: { total_input_tokens: 5 } });
    expect(read).toBe(`${badgeOf(5)} ${modelBadgeOf('HAIKU 5.5')}`);
    const unknown = mainBadgesOf({});
    expect(unknown).toBe(badgeOf(0));
  });
});

describe('mainContextOf', () => {
  it('reads the context window Claude Code sends', () => {
    const path = transcriptOf([assistant(1, 0, 0)]);

    const tokens = mainContextOf({
      transcript_path: path,
      context_window: { total_input_tokens: 151_000 },
    });

    expect(tokens).toBe(151_000);
  });

  it('falls back to the transcript without one', () => {
    const path = transcriptOf([assistant(1, 2, 3)]);

    const nullWindowContext = mainContextOf({ transcript_path: path, context_window: { total_input_tokens: null } });
    expect(nullWindowContext).toBe(6);
    const noWindowContext = mainContextOf({ transcript_path: path });
    expect(noWindowContext).toBe(6);
    const emptyPayloadContext = mainContextOf({});
    expect(emptyPayloadContext).toBe(0);
  });
});

describe('subagentRowsOf', () => {
  it('badges each subagent with its own transcript\'s context, before its label', () => {
    const main = transcriptOf([assistant(1, 0, 0)]);
    mkdirSync(join(directory, 'main', 'subagents'), { recursive: true });
    transcriptOf([assistant(0, 136_000, 0)], join('main', 'subagents', 'agent-a1.jsonl'));

    const rows = subagentRowsOf({
      transcript_path: main,
      tasks: [
        {
          id: 'a1',
          type: 'local_agent',
          label: 'Review',
          description: 'unused',
          tokenCount: 5,
        },
        {
          id: 'b1',
          type: 'local_bash',
          label: 'npm test',
        },
        { type: 'local_agent', label: 'no id' },
        'row',
      ],
    });

    const expected = [{ id: 'a1', content: `${badgeOf(136_000)} Review` }];
    expect(rows).toEqual(expected);
  });

  it('falls back to the reported token count, and to the description or no label', () => {
    const rows = subagentRowsOf({
      transcript_path: join(directory, 'main.jsonl'),
      tasks: [
        {
          id: 'a1',
          type: 'local_agent',
          description: 'Explore',
          tokenCount: 151_000,
        },
        {
          id: 'a2',
          type: 'local_agent',
          label: 7,
        },
      ],
    });

    const expected = [
      { id: 'a1', content: `${badgeOf(151_000)} Explore` },
      { id: 'a2', content: badgeOf(0) },
    ];
    expect(rows).toEqual(expected);
  });

  it('reads no subagent transcript when the payload names no transcript', () => {
    const rows = subagentRowsOf({ tasks: [{
      id: 'a1',
      type: 'local_agent',
      tokenCount: 7,
    }] });
    const expected = [{ id: 'a1', content: badgeOf(7) }];
    expect(rows).toEqual(expected);
  });

  it('shows how long each subagent has run, from its transcript\'s first timestamp', () => {
    const main = transcriptOf([assistant(1, 0, 0)]);
    mkdirSync(join(directory, 'main', 'subagents'), { recursive: true });
    const first = JSON.stringify({ type: 'user', timestamp: '2026-10-14T07:00:00.000Z' });

    transcriptOf([
      first,
      modelEntry('claude-fable-5-1'),
      assistant(0, 84_000, 0),
    ], join('main', 'subagents', 'agent-a1.jsonl'));

    const now = Date.parse('2026-10-14T08:12:30.000Z');

    const rows = subagentRowsOf({
      transcript_path: main,
      tasks: [{
        id: 'a1',
        type: 'local_agent',
        label: 'Run 6',
      }],
    }, now);

    const expected = [{ id: 'a1', content: `${badgeOf(84_000)} ${modelBadgeOf('FABLE 5.1')} Run 6 1h 12m` }];
    expect(rows).toEqual(expected);
  });

  it('takes the start time and model Claude Code sends, and pins the run time to the right edge', () => {
    const now = Date.parse('2026-10-14T08:12:30.000Z');
    const task = {
      id: 'a1',
      type: 'local_agent',
      label: 'Run 6',
      model: 'claude-opus-5-5',
      startTime: Date.parse('2026-10-14T08:00:00.000Z'),
    };
    const left = `${badgeOf(5)} ${modelBadgeOf('OPUS 5.5')}`;

    const wide = subagentRowsOf({ columns: 40, tasks: [{ ...task, tokenCount: 5 }] }, now);
    expect(wide).toEqual([{ id: 'a1', content: `${left} Run 6            12m` }]);
    const narrow = subagentRowsOf({ columns: 25, tasks: [{ ...task, tokenCount: 5 }] }, now);
    expect(narrow).toEqual([{ id: 'a1', content: `${left} R 12m` }]);
    const tight = subagentRowsOf({ columns: 10, tasks: [{ ...task, tokenCount: 5 }] }, now);
    expect(tight).toEqual([{ id: 'a1', content: `${left} 12m` }]);
  });

  it('answers no rows without tasks', () => {
    const noTasksRows = subagentRowsOf({});
    expect(noTasksRows).toEqual([]);
    const textTasksRows = subagentRowsOf({ tasks: 'none' });
    expect(textTasksRows).toEqual([]);
  });
});

describe('contextWarningOf', () => {
  const warning = (size: string): object => {
    const expected = {
      systemMessage: `Context passed 150K (${size}). Consider /compact or a fresh session.`,
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `Context is ${size}, past 150K. Tell the user so in one line, and keep replies lean.`,
      },
    };

    return expected;
  };

  const inputAt = (tokens: number): SessionInput => {
    const entry = assistant(0, tokens, 0);
    const transcript = transcriptOf([entry]);
    const input: SessionInput = {
      session: 's12a',
      transcript,
    };

    return input;
  };

  it('warns once past the ceiling, and again only after the context drops back under', () => {
    const over = inputAt(188_000);
    const first = contextWarningOf(over, directory);
    const second = contextWarningOf(over, directory);
    const under = contextWarningOf(inputAt(40_000), directory);
    const again = contextWarningOf(inputAt(188_000), directory);

    const actual = [
      first,
      second,
      under,
      again,
    ];
    const expected = [
      warning('188K'),
      undefined,
      undefined,
      warning('188K'),
    ];
    expect(actual).toEqual(expected);
  });

  it('stays silent under the ceiling and leaves no marker', () => {
    const output = contextWarningOf(inputAt(149_999), directory);

    expect(output).toBeUndefined();
    const exists = existsSync(join(directory, 'linteljs-context-s12a'));
    expect(exists).toBe(false);
  });

  it('warns at exactly the ceiling', () => {
    const output = contextWarningOf(inputAt(150_000), directory);

    expect(output).toEqual(warning('150K'));
  });

  it('creates a marker directory that does not exist yet', () => {
    const data = join(directory, 'data');
    const output = contextWarningOf(inputAt(188_000), data);

    expect(output).toEqual(warning('188K'));
    const exists = existsSync(join(data, 'linteljs-context-s12a'));
    expect(exists).toBe(true);
  });

  describe('for a subagent', () => {
    const agentInputAt = (tokens: number, type?: string): SessionInput => {
      const main = transcriptOf([assistant(0, 1, 0)]);
      const subagents = join(directory, 'main', 'subagents');
      mkdirSync(subagents, { recursive: true });
      writeFileSync(join(subagents, 'agent-a1.jsonl'), `${assistant(0, tokens, 0)}\n`);
      const input: SessionInput = {
        session: 's12a',
        transcript: main,
        agent: { id: 'a1', type },
      };

      return input;
    };

    const near = (size: string): object => {
      const expected = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `Context is ${size} of a 150K ceiling. Finish the current step, commit work that `
            + 'passes the check, and return your report.',
        },
      };

      return expected;
    };

    const block = {
      decision: 'block',
      reason: 'Context is 188K, past the 150K ceiling. Stop now: commit only work that passes the check, '
        + 'and return your report. Start no new work.',
    };

    it('reads its own transcript and stays silent under the warning line', () => {
      const output = contextWarningOf(agentInputAt(129_999), directory);

      expect(output).toBeUndefined();
    });

    it('nudges from the warning line up to the ceiling, every call', () => {
      const input = agentInputAt(130_000);
      const first = contextWarningOf(input, directory);
      const second = contextWarningOf(input, directory);
      const last = contextWarningOf(agentInputAt(149_999), directory);

      const actual = [
        first,
        second,
        last,
      ];
      const expected = [
        near('130K'),
        near('130K'),
        near('149K'),
      ];
      expect(actual).toEqual(expected);
    });

    it('blocks every call past the ceiling and tells the user once, by type, until it drops back under', () => {
      const over = agentInputAt(188_000, 'Explore');
      const first = contextWarningOf(over, directory);
      const second = contextWarningOf(over, directory);
      contextWarningOf(agentInputAt(40_000), directory);
      const again = contextWarningOf(agentInputAt(188_000, 'Explore'), directory);

      const told = {
        ...block,
        systemMessage: 'Subagent Explore passed 150K (188K); told to stop.',
      };
      const actual = [
        first,
        second,
        again,
      ];
      const expected = [
        told,
        block,
        told,
      ];
      expect(actual).toEqual(expected);
    });

    it('names a subagent with no type by its id, and keeps its marker apart from the main session\'s', () => {
      const output = contextWarningOf(agentInputAt(188_000), directory);

      const expected = {
        ...block,
        systemMessage: 'Subagent a1 passed 150K (188K); told to stop.',
      };
      expect(output).toEqual(expected);
      const agentMarked = existsSync(join(directory, 'linteljs-context-s12a-a1'));
      const mainMarked = existsSync(join(directory, 'linteljs-context-s12a'));
      const markers = [agentMarked, mainMarked];
      expect(markers).toEqual([true, false]);
    });
  });
});
