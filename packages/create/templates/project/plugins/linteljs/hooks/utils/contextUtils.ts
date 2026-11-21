import {
  closeSync,
  existsSync,
  fstatSync,
  mkdirSync,
  openSync,
  readSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';

import {
  BADGE_COLOURS,
  DEFAULT_CONTEXT_CEILING_TOKENS,
  DEFAULT_CONTEXT_WARN_TOKENS,
  MINUTES_PER_HOUR,
  MODEL_BADGE_COLOUR,
  MS_PER_MINUTE,
  TOKENS_PER_K,
  TRANSCRIPT_HEAD_BYTES,
  TRANSCRIPT_TAIL_BYTES,
} from '../constants.ts';

import {
  type Agent,
  fieldAt,
  type Json,
  jsonObjectOf,
  type SessionInput,
} from './hostUtils.ts';

export interface SubagentRow {
  id: string;
  content: string;
}

export const tokensFromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const CONTEXT_WARN_TOKENS = tokensFromEnv('CONTEXT_WARN_TOKENS', DEFAULT_CONTEXT_WARN_TOKENS);

const CONTEXT_CEILING_TOKENS = tokensFromEnv('CONTEXT_CEILING_TOKENS', DEFAULT_CONTEXT_CEILING_TOKENS);

const USAGE_KEYS = [
  'input_tokens',
  'cache_read_input_tokens',
  'cache_creation_input_tokens',
];

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

const assistantTokensOf = (line: string): number | undefined => {
  const entry = jsonObjectOf(() => {
    return line;
  });

  if (stringAt(entry, 'type') !== 'assistant') {
    return undefined;
  }

  const usage = objectAt(objectAt(entry, 'message'), 'usage');
  return usage === undefined ? undefined : usageTokensOf(usage);
};

const tailOf = (path: string, tailBytes: number): string => {
  const descriptor = openSync(path, 'r');

  try {
    const { size } = fstatSync(descriptor);
    const length = Math.min(size, tailBytes);
    const buffer = Buffer.alloc(length);
    readSync(descriptor, buffer, 0, length, size - length);
    return buffer.toString('utf8');
  }
  finally {
    closeSync(descriptor);
  }
};

// `claude-opus-5-5[1m]` reads `OPUS 5.5`, `claude-sonnet-4-20250514` reads `SONNET 4`; anything else has no name.
export const modelNameOf = (id: string | undefined): string | undefined => {
  if (id === undefined) {
    return undefined;
  }

  const name = /^claude-[a-z]+-\d+(?:-\d{1,2})?(?=-|\[|$)/u.exec(id)?.[0];

  if (name === undefined) {
    return undefined;
  }

  return name
    .replace(/^claude-/u, '')
    .toUpperCase()
    .replace('-', ' ')
    .replace('-', '.');
};

const assistantModelOf = (line: string): string | undefined => {
  const entry = jsonObjectOf(() => {
    return line;
  });

  if (stringAt(entry, 'type') !== 'assistant') {
    return undefined;
  }

  const message = objectAt(entry, 'message');
  const model = stringAt(message, 'model');

  return modelNameOf(model);
};

// The newest assistant entry `pick` answers for; a line the tail cut in half fails to parse and is skipped.
const lastAssistantOf = <T>(
  transcript: string,
  pick: (line: string) => T | undefined,
  tailBytes: number,
): T | undefined => {
  try {
    for (const line of tailOf(transcript, tailBytes)
      .split('\n')
      .toReversed()) {
      const value = pick(line);

      if (value !== undefined) {
        return value;
      }
    }
  }
  catch {
    // An unreadable transcript answers nothing.
  }

  return undefined;
};

// Live context is the last assistant entry's prompt size.
export const contextOf = (transcript: string, tailBytes = TRANSCRIPT_TAIL_BYTES): number => {
  return lastAssistantOf(transcript, assistantTokensOf, tailBytes) ?? 0;
};

// The model is the one that wrote the last assistant entry; synthetic entries name none.
export const transcriptModelOf = (transcript: string, tailBytes = TRANSCRIPT_TAIL_BYTES): string | undefined => {
  return lastAssistantOf(transcript, assistantModelOf, tailBytes);
};

const headOf = (path: string, headBytes: number): string => {
  const descriptor = openSync(path, 'r');

  try {
    const buffer = Buffer.alloc(headBytes);
    const read = readSync(descriptor, buffer, 0, headBytes, 0);
    return buffer.toString('utf8', 0, read);
  }
  finally {
    closeSync(descriptor);
  }
};

// A transcript starts when its first entry was written.
export const startedAtOf = (transcript: string, headBytes = TRANSCRIPT_HEAD_BYTES): number | undefined => {
  try {
    const head = headOf(transcript, headBytes);
    const stamp = /"timestamp":"([^"]+)"/u.exec(head)?.[1];
    const time = stamp === undefined ? Number.NaN : Date.parse(stamp);
    return Number.isNaN(time) ? undefined : time;
  }
  catch {
    return undefined;
  }
};

export const elapsedOf = (milliseconds: number): string => {
  const minutes = Math.max(0, Math.floor(milliseconds / MS_PER_MINUTE));
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);

  return hours === 0 ? `${String(minutes)}m` : `${String(hours)}h ${String(minutes % MINUTES_PER_HOUR)}m`;
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

export const modelBadgeOf = (name: string): string => {
  return `\u001B[38;5;${String(MODEL_BADGE_COLOUR)}m[${name}]\u001B[0m`;
};

const namedContextOf = (payload: object, pathOf: (transcript: string) => string): number => {
  const transcript = stringAt(payload, 'transcript_path');

  if (transcript === undefined) {
    return 0;
  }

  const path = pathOf(transcript);

  return contextOf(path);
};

// Claude Code sends the last API call's prompt size as `total_input_tokens`; an older one sends no
// `context_window`, so the transcript answers instead.
export const mainContextOf = (payload: object): number => {
  const reported = numberAt(objectAt(payload, 'context_window'), 'total_input_tokens');

  if (reported !== undefined) {
    return reported;
  }

  return namedContextOf(payload, (transcript) => {
    return transcript;
  });
};

// Claude Code sends the session's model id; without it the transcript answers.
export const mainModelOf = (payload: object): string | undefined => {
  const transcript = stringAt(payload, 'transcript_path');
  const model = objectAt(payload, 'model');
  const id = stringAt(model, 'id');
  const reported = modelNameOf(id);

  return reported ?? (transcript === undefined ? undefined : transcriptModelOf(transcript));
};

// The context badge, then the model badge when the model is known.
export const mainBadgesOf = (payload: object): string => {
  const model = mainModelOf(payload);
  const context = mainContextOf(payload);
  const badge = badgeOf(context);

  return model === undefined ? badge : `${badge} ${modelBadgeOf(model)}`;
};

// What the terminal shows of a string: its colour codes take no width.
const visibleWidthOf = (text: string): number => {
  return text.replaceAll(/\u001B\[[\d;]*m/gu, '').length;
};

// The run time sits at the row's right edge, as in Claude Code's own row; the label is cut to make room.
const rowOf = (
  left: string,
  label: string | undefined,
  elapsed: string | undefined,
  columns: number | undefined,
): string => {
  const head = label === undefined ? left : `${left} ${label}`;

  if (elapsed === undefined) {
    return head;
  }

  if (columns === undefined) {
    return `${head} ${elapsed}`;
  }

  const room = columns - visibleWidthOf(left) - elapsed.length - 2;
  const cut = label === undefined || room < 1 ? undefined : label.slice(0, room);
  const start = cut === undefined ? left : `${left} ${cut}`;
  const gap = Math.max(1, columns - visibleWidthOf(start) - elapsed.length);

  return `${start}${' '.repeat(gap)}${elapsed}`;
};

// Only `local_agent` rows are subagents; any other row keeps Claude Code's own rendering. Claude Code sends each
// task's start time and model; the subagent's transcript answers when it does not.
export const subagentRowsOf = (payload: object, now = Date.now()): SubagentRow[] => {
  const tasks = objectAt(payload, 'tasks') ?? {};
  const transcript = stringAt(payload, 'transcript_path');

  return Object.keys(tasks)
    .flatMap((key) => {
      const task = fieldAt(tasks, key);
      const id = stringAt(task, 'id');

      if (id === undefined || stringAt(task, 'type') !== 'local_agent') {
        return [];
      }

      const read = namedContextOf(payload, (path) => {
        return subagentTranscriptOf(path, id);
      });
      const tokens = read === 0 ? numberAt(task, 'tokenCount') ?? 0 : read;
      const label = stringAt(task, 'label') ?? stringAt(task, 'description');
      const own = transcript === undefined ? undefined : subagentTranscriptOf(transcript, id);
      const startedAt = numberAt(task, 'startTime') ?? (own === undefined ? undefined : startedAtOf(own));
      const elapsed = startedAt === undefined ? undefined : elapsedOf(now - startedAt);
      const sent = stringAt(task, 'model');
      const model = modelNameOf(sent) ?? (own === undefined ? undefined : transcriptModelOf(own));
      const badge = badgeOf(tokens);
      const left = model === undefined ? badge : `${badge} ${modelBadgeOf(model)}`;
      const content = rowOf(left, label, elapsed, numberAt(payload, 'columns'));
      const rows = [
        {
          id,
          content,
        },
      ];

      return rows;
    });
};

const CEILING = `${String(CONTEXT_CEILING_TOKENS / TOKENS_PER_K)}K`;

const sizeOf = (tokens: number): string => {
  const thousands = Math.floor(tokens / TOKENS_PER_K);
  return `${String(thousands)}K`;
};

const markerOf = (input: SessionInput, directory: string): string => {
  const name = input.agent === undefined ? input.session : `${input.session}-${input.agent.id}`;
  return join(directory, `linteljs-context-${name}`);
};

// True the first time only; the marker holds until the context drops back under.
const isFirstPass = (marker: string, directory: string): boolean => {
  if (existsSync(marker)) {
    return false;
  }

  mkdirSync(directory, { recursive: true });
  closeSync(openSync(marker, 'w'));
  return true;
};

const mainWarningOf = (size: string): object => {
  const warning = {
    systemMessage: `Context passed ${CEILING} (${size}). Consider /compact or a fresh session.`,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `Context is ${size}, past ${CEILING}. Tell the user so in one line, and keep replies lean.`,
    },
  };

  return warning;
};

const subagentNearOf = (size: string): object => {
  const warning = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `Context is ${size} of a ${CEILING} ceiling. Finish the current step, commit work that `
        + 'passes the check, and return your report.',
    },
  };

  return warning;
};

// Every call past the ceiling is blocked; the user hears of it once.
const subagentOverOf = (size: string, agent: Agent, isFirst: boolean): object => {
  const block = {
    decision: 'block',
    reason: `Context is ${size}, past the ${CEILING} ceiling. Stop now: commit only work that passes the check, `
      + 'and return your report. Start no new work.',
  };

  const told = {
    ...block,
    systemMessage: `Subagent ${agent.type ?? agent.id} passed ${CEILING} (${size}); told to stop.`,
  };

  return isFirst ? told : block;
};

// The main session is told once past the ceiling; a subagent is nudged from the warning line and blocked past the
// ceiling. Dropping back under clears the marker.
export const contextWarningOf = (input: SessionInput, directory: string): object | undefined => {
  const { agent } = input;
  const transcript = agent === undefined ? input.transcript : subagentTranscriptOf(input.transcript, agent.id);
  const tokens = contextOf(transcript);
  const marker = markerOf(input, directory);
  const size = sizeOf(tokens);

  if (tokens < CONTEXT_CEILING_TOKENS) {
    rmSync(marker, { force: true });
    return agent === undefined || tokens < CONTEXT_WARN_TOKENS ? undefined : subagentNearOf(size);
  }

  const isFirst = isFirstPass(marker, directory);

  if (agent !== undefined) {
    return subagentOverOf(size, agent, isFirst);
  }

  return isFirst ? mainWarningOf(size) : undefined;
};
