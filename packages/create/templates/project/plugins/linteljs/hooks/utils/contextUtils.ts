import {
  closeSync,
  fstatSync,
  openSync,
  readSync,
} from 'node:fs';
import { join } from 'node:path';

import {
  BADGE_COLOURS,
  CONTEXT_CEILING_TOKENS,
  CONTEXT_WARN_TOKENS,
  TOKENS_PER_K,
  TRANSCRIPT_TAIL_BYTES,
} from '../constants.ts';

type Json = number | object | string;

export interface SubagentRow {
  id: string;
  content: string;
}

const USAGE_KEYS = [
  'input_tokens',
  'cache_read_input_tokens',
  'cache_creation_input_tokens',
];

const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

const isJsonEntry = (entry: [string, unknown]): entry is [string, Json] => {
  const [, field] = entry;
  return typeof field === 'number' || typeof field === 'string' || isObject(field);
};

const fieldAt = (value: Json | undefined, key: string): Json | undefined => {
  if (typeof value !== 'object') {
    return undefined;
  }

  const fields = new Map(Object.entries(value).filter(isJsonEntry));

  return fields.get(key);
};

const objectAt = (value: Json | undefined, key: string): object | undefined => {
  const field = fieldAt(value, key);
  return typeof field === 'object' ? field : undefined;
};

const numberAt = (value: Json | undefined, key: string): number | undefined => {
  const field = fieldAt(value, key);
  return typeof field === 'number' ? field : undefined;
};

const stringAt = (value: Json | undefined, key: string): string | undefined => {
  const field = fieldAt(value, key);
  return typeof field === 'string' ? field : undefined;
};

// The prompt an API call sent: fresh input plus what the cache read and wrote.
const usageTokensOf = (usage: object): number => {
  return USAGE_KEYS
    .reduce((sum, key) => {
      return sum + (numberAt(usage, key) ?? 0);
    }, 0);
};

const entryOf = (line: string): object | undefined => {
  try {
    const entry: unknown = JSON.parse(line);
    return isObject(entry) ? entry : undefined;
  }
  catch {
    return undefined;
  }
};

const assistantTokensOf = (line: string): number | undefined => {
  const entry = entryOf(line);

  if (entry === undefined || stringAt(entry, 'type') !== 'assistant') {
    return undefined;
  }

  const usage = objectAt(objectAt(entry, 'message'), 'usage');
  return usage === undefined ? undefined : usageTokensOf(usage);
};

const tailOf = (path: string): string | undefined => {
  try {
    const descriptor = openSync(path, 'r');

    try {
      const { size } = fstatSync(descriptor);
      const length = Math.min(size, TRANSCRIPT_TAIL_BYTES);
      const buffer = Buffer.alloc(length);
      readSync(descriptor, buffer, 0, length, size - length);
      return buffer.toString('utf8');
    }
    finally {
      closeSync(descriptor);
    }
  }
  catch {
    return undefined;
  }
};

// Live context is the last assistant entry's prompt size; a line the tail cut in half fails to parse and is skipped.
export const contextOf = (transcript: string): number => {
  const lines = (tailOf(transcript) ?? '').split('\n');

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const tokens = assistantTokensOf(lines[index] ?? '');

    if (tokens !== undefined) {
      return tokens;
    }
  }

  return 0;
};

export const subagentTranscriptOf = (transcript: string, agentId: string): string => {
  const sessionDirectory = transcript.replace(/\.jsonl$/u, '');

  return join(sessionDirectory, 'subagents', `agent-${agentId}.jsonl`);
};

// The number is always printed, so the colour is never the only cue.
export const badgeOf = (tokens: number): string => {
  let colour: number = BADGE_COLOURS.over;

  if (tokens < CONTEXT_WARN_TOKENS) {
    colour = BADGE_COLOURS.under;
  }
  else if (tokens < CONTEXT_CEILING_TOKENS) {
    colour = BADGE_COLOURS.near;
  }

  const thousands = Math.floor(tokens / TOKENS_PER_K);

  return `\u001B[38;5;${String(colour)}m[CTX ${String(thousands)}K]\u001B[0m`;
};

// Claude Code sends the last API call's prompt size as `total_input_tokens`; an older one sends no
// `context_window`, so the transcript answers instead.
export const mainContextOf = (payload: object): number => {
  const reported = numberAt(objectAt(payload, 'context_window'), 'total_input_tokens');

  if (reported !== undefined) {
    return reported;
  }

  const transcript = stringAt(payload, 'transcript_path') ?? '';

  return contextOf(transcript);
};

// Only `local_agent` rows are subagents; any other row keeps Claude Code's own rendering.
export const subagentRowsOf = (payload: object): SubagentRow[] => {
  const transcript = stringAt(payload, 'transcript_path') ?? '';
  return Object.values(objectAt(payload, 'tasks') ?? {})
    .filter(isObject)
    .flatMap((task) => {
      const id = stringAt(task, 'id');

      if (id === undefined || stringAt(task, 'type') !== 'local_agent') {
        return [];
      }

      const read = contextOf(subagentTranscriptOf(transcript, id));
      const tokens = read === 0 ? numberAt(task, 'tokenCount') ?? 0 : read;
      const label = stringAt(task, 'label') ?? stringAt(task, 'description');
      const rows = [
        {
          id,
          content: label === undefined ? badgeOf(tokens) : `${badgeOf(tokens)} ${label}`,
        },
      ];

      return rows;
    });
};
