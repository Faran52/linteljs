import {
  mkdirSync,
  mkdtempSync,
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

import { TRANSCRIPT_TAIL_BYTES } from '../constants.ts';

import {
  badgeOf,
  contextOf,
  mainContextOf,
  subagentRowsOf,
  subagentTranscriptOf,
} from './contextUtils.ts';

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
  directory = mkdtempSync(join(tmpdir(), 'linteljs-context-'));
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

  it('answers zero for a missing file or one with no assistant entry', () => {
    const empty = transcriptOf([JSON.stringify({ type: 'user' })]);

    const context = contextOf(join(directory, 'missing.jsonl'));
    expect(context).toBe(0);
    const emptyContext = contextOf(empty);
    expect(emptyContext).toBe(0);
    const directoryContext = contextOf(directory);
    expect(directoryContext).toBe(0);
  });

  it('reads only the tail, so an entry further back is not seen', () => {
    const filler = JSON.stringify({ type: 'user', text: 'x'.repeat(TRANSCRIPT_TAIL_BYTES) });
    const path = transcriptOf([assistant(1, 0, 0), filler]);

    const tokens = contextOf(path);

    expect(tokens).toBe(0);
  });

  it('reads an entry that ends exactly at the tail', () => {
    const line = assistant(5, 0, 0);
    const filler = JSON.stringify({ type: 'user', text: 'x'.repeat(TRANSCRIPT_TAIL_BYTES - line.length - 40) });
    const path = transcriptOf([filler, line]);

    const tokens = contextOf(path);

    expect(tokens).toBe(5);
  });
});

it('finds a subagent\'s transcript beside the main one', () => {
  const path = subagentTranscriptOf('/p/session.jsonl', 'a1b2');

  expect(path).toBe(join('/p/session', 'subagents', 'agent-a1b2.jsonl'));
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

    const mainContext = mainContextOf({ transcript_path: path, context_window: { total_input_tokens: null } });
    expect(mainContext).toBe(6);
    const mainContext2 = mainContextOf({ transcript_path: path });
    expect(mainContext2).toBe(6);
    const mainContext3 = mainContextOf({});
    expect(mainContext3).toBe(0);
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
        { id: 'a2', type: 'local_agent' },
      ],
    });

    const expected = [
      { id: 'a1', content: `${badgeOf(151_000)} Explore` },
      { id: 'a2', content: badgeOf(0) },
    ];
    expect(rows).toEqual(expected);
  });

  it('answers no rows without tasks', () => {
    const subagentRows = subagentRowsOf({});
    expect(subagentRows).toEqual([]);
    const subagentRows2 = subagentRowsOf({ tasks: 'none' });
    expect(subagentRows2).toEqual([]);
  });
});
