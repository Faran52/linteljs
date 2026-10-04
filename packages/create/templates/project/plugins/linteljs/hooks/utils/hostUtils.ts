// Claude Code and Codex send the same payload and read the same decision, so `claude` names both.
import { readFileSync } from 'node:fs';

import type { Dialect } from './commandParserUtils.ts';

export type Host = 'claude' | 'copilot' | 'cursor';

export type DecisionKind = 'block' | 'deny' | 'warn';

// The one event each command hook answers under Cursor; `.cursor/hooks.json` registers it there and nowhere else.
export type CursorEvent = 'beforeShellExecution' | 'postToolUse';

export interface CommandInput {
  host: Host;
  command: string;
  dialect: Dialect;
}

export interface EditInput {
  host: Host;
  cwd: string;
  paths: string[];
}

export interface SessionInput {
  session: string;
  transcript: string;
}

type Field = 'command' | 'cursor_version' | 'cwd' | 'file_path' | 'filePath' | 'hook_event_name' | 'patch' | 'path'
  | 'session_id' | 'tool_input' | 'tool_name' | 'tool_response' | 'toolArgs' | 'toolName' | 'transcript_path';

export type Json = number | object | string;

// A session id names a state file, so nothing but a plain token is accepted.
const SESSION_ID = /^[\w-]+$/u;

const PATCHED_FILE = /^\*\*\* (?:Add|Update) File: (.+)/u;

export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

// A payload is whatever the host sent, so a field is read only once it proves to be JSON its readers can narrow.
const isJsonEntry = (entry: [string, unknown]): entry is [string, Json] => {
  const [, field] = entry;
  return typeof field === 'number' || typeof field === 'string' || isObject(field);
};

// Unreadable, or JSON that is not an object, reads as nothing.
export const jsonObjectOf = (read: () => string): object | undefined => {
  try {
    const parsed: unknown = JSON.parse(read());
    return isObject(parsed) ? parsed : undefined;
  }
  catch {
    // Falls through to nothing.
  }

  return undefined;
};

export const fieldAt = (value: Json | undefined, key: string): Json | undefined => {
  if (typeof value !== 'object') {
    return undefined;
  }

  const field = Object.entries(value)
    .filter(isJsonEntry)
    .find(([name]) => {
      return name === key;
    });

  return field?.[1];
};

const stringAt = (value: Json | undefined, key: Field): string | undefined => {
  const field = fieldAt(value, key);
  return typeof field === 'string' ? field : undefined;
};

// Copilot CLI sends `toolArgs` as JSON text and its SDK as an object, so both read as the object.
const toolArgumentsOf = (payload: object): Json | undefined => {
  const toolArguments = fieldAt(payload, 'toolArgs');

  return typeof toolArguments === 'string'
    ? jsonObjectOf(() => {
        return toolArguments;
      })
    : toolArguments;
};

// Every Cursor payload carries `cursor_version`, and only Copilot's camelCase payload names its tool `toolName`.
export const hostOf = (payload: object): Host => {
  if (stringAt(payload, 'cursor_version') !== undefined) {
    return 'cursor';
  }

  return 'toolName' in payload ? 'copilot' : 'claude';
};

const toolInputOf = (payload: object, host: Host): Json | undefined => {
  return host === 'copilot' ? toolArgumentsOf(payload) : fieldAt(payload, 'tool_input');
};

// Descriptor 0, not `node:process`'s stdin, which is set non-blocking and fails a large read with EAGAIN.
export const readPayload = (source: number | string = 0): object | undefined => {
  return jsonObjectOf(() => {
    const text = String(readFileSync(source));
    return text;
  });
};

// Cursor also runs Claude Code's hooks, so a payload for any other event is that second copy and stays silent.
export const readCommand = (
  payload: object,
  cursorEvent: CursorEvent,
  platform: NodeJS.Platform = process.platform,
): CommandInput | undefined => {
  const host = hostOf(payload);

  if (host === 'cursor' && stringAt(payload, 'hook_event_name') !== cursorEvent) {
    return undefined;
  }

  const toolInput = toolInputOf(payload, host);
  const command = stringAt(toolInput, 'command') ?? stringAt(payload, 'command');

  if (command === undefined) {
    return undefined;
  }

  const tool = stringAt(payload, 'tool_name') ?? stringAt(payload, 'toolName');
  const powershell = host === 'cursor' ? platform === 'win32' : tool?.toLowerCase() === 'powershell';
  const commandInput: CommandInput = {
    host,
    command,
    dialect: powershell ? 'powershell' : 'bash',
  };

  return commandInput;
};

// Cursor documents no file path on the one edit event that can answer the agent.
export const readEdit = (payload: object): EditInput | undefined => {
  const host = hostOf(payload);

  if (host === 'cursor') {
    return undefined;
  }

  const input = toolInputOf(payload, host);
  const response = fieldAt(payload, 'tool_response');
  const named = [
    stringAt(input, 'file_path'),
    stringAt(input, 'path'),
    stringAt(response, 'filePath'),
  ];
  const patch = stringAt(input, 'command') ?? stringAt(input, 'patch') ?? input;
  const patched = typeof patch === 'string'
    ? patch
        .split(/\r?\n/u)
        .map((line) => {
          return PATCHED_FILE.exec(line)?.[1];
        })
    : [];

  const paths = [...named, ...patched]
    .filter((path) => {
      return path !== undefined;
    });
  const editInput: EditInput = {
    host,
    cwd: stringAt(payload, 'cwd') ?? '',
    paths,
  };

  return editInput;
};

// Claude Code adds `agent_id` to a subagent's tool call, so only the main session's own calls are read.
export const readSession = (payload: object): SessionInput | undefined => {
  const session = stringAt(payload, 'session_id');
  const transcript = stringAt(payload, 'transcript_path');

  if (hostOf(payload) !== 'claude' || 'agent_id' in payload || transcript === undefined) {
    return undefined;
  }

  if (session === undefined || !SESSION_ID.test(session)) {
    return undefined;
  }

  const sessionInput: SessionInput = {
    session,
    transcript,
  };

  return sessionInput;
};

const cursorDecision = (kind: DecisionKind, text: string): object => {
  const decision = kind === 'deny'
    ? {
        permission: 'deny',
        user_message: text,
        agent_message: text,
      }
    : { additional_context: text };

  return decision;
};

const copilotDecision = (kind: DecisionKind, text: string): object => {
  const decision = kind === 'deny'
    ? {
        permissionDecision: 'deny',
        permissionDecisionReason: text,
      }
    : { additionalContext: text };

  return decision;
};

const claudeDecision = (kind: DecisionKind, text: string): object => {
  if (kind === 'block') {
    const block = {
      decision: 'block',
      reason: text,
    };

    return block;
  }

  const decision = {
    hookSpecificOutput: kind === 'deny'
      ? {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: text,
        }
      : {
          hookEventName: 'PreToolUse',
          additionalContext: text,
        },
  };

  return decision;
};

// Cursor's shell gate answers a clear command too: its own examples print an explicit allow.
export const decisionOf = (host: Host, kind: DecisionKind, text: string | undefined): object | undefined => {
  if (text === undefined) {
    const allow = { permission: 'allow' };

    return host === 'cursor' && kind === 'deny' ? allow : undefined;
  }

  if (host === 'cursor') {
    return cursorDecision(kind, text);
  }

  return host === 'copilot' ? copilotDecision(kind, text) : claudeDecision(kind, text);
};

// Stdout is the decision JSON on one line or nothing: a host parses it whole, and a stray line voids the decision.
export const writeDecision = (host: Host, kind: DecisionKind, text: string | undefined): void => {
  const decision = decisionOf(host, kind, text);

  if (decision !== undefined) {
    process.stdout.write(`${JSON.stringify(decision)}\n`);
  }
};
