/**
 * The four hosts in and out of one shape. Each hook reads its payload through here, judges what it was handed, and
 * writes its decision back through here, so the guards never learn which agent called them. Claude Code and Codex
 * send the same payload and read the same decision, so `claude` names both.
 */
import { readFileSync } from 'node:fs';

import type { Dialect } from './commandParserUtils.ts';

export type Host = 'claude' | 'copilot' | 'cursor';

// `deny` stops a shell command, `warn` tells the agent without stopping anything, `block` reports a finished edit.
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

type Field = 'command' | 'cursor_version' | 'cwd' | 'file_path' | 'filePath' | 'hook_event_name' | 'patch' | 'path'
  | 'tool_input' | 'tool_name' | 'tool_response' | 'toolArgs' | 'toolName';

type FieldValue = object | string | undefined;

const PATCHED_FILE = /^\*\*\* (?:Add|Update) File: (.+)$/u;

const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

// A payload is whatever the host sent, so a field is read only once it proves to be a string or an object.
const isFieldEntry = (entry: [string, unknown]): entry is [string, object | string] => {
  const [, field] = entry;
  return typeof field === 'string' || isObject(field);
};

const valueAt = (value: FieldValue, key: Field): FieldValue => {
  return typeof value === 'object' ? new Map(Object.entries(value).filter(isFieldEntry)).get(key) : undefined;
};

const stringAt = (value: FieldValue, key: Field): string | undefined => {
  const field = valueAt(value, key);
  return typeof field === 'string' ? field : undefined;
};

// Copilot CLI sends `toolArgs` as JSON text and its SDK as an object, so both read as the object.
const toolArgumentsOf = (payload: object): object | undefined => {
  const toolArguments = valueAt(payload, 'toolArgs');
  if (typeof toolArguments !== 'string') {
    return toolArguments;
  }
  try {
    const parsed: unknown = JSON.parse(toolArguments);
    return isObject(parsed) ? parsed : undefined;
  }
  catch {
    return undefined;
  }
};

// Every Cursor payload carries `cursor_version`, and only Copilot's camelCase payload names its tool `toolName`.
export const hostOf = (payload: object): Host => {
  if (stringAt(payload, 'cursor_version') !== undefined) {
    return 'cursor';
  }
  return 'toolName' in payload ? 'copilot' : 'claude';
};

const toolInputOf = (payload: object, host: Host): FieldValue => {
  return host === 'copilot' ? toolArgumentsOf(payload) : valueAt(payload, 'tool_input');
};

// The process global rather than `node:process`, which sets stdin non-blocking and fails a large read with EAGAIN.
// Malformed JSON, or JSON that is not an object, is no payload to judge.
export const readPayload = (): object | undefined => {
  try {
    const payload: unknown = JSON.parse(readFileSync(0, 'utf8'));
    return isObject(payload) ? payload : undefined;
  }
  catch {
    return undefined;
  }
};

/**
 * Cursor also runs Claude Code's hooks, as `preToolUse` and `postToolUse`, so a Cursor payload for any event but the
 * one `.cursor/hooks.json` gives this hook is that second copy, and it stays silent. Cursor's payload names no shell,
 * so the platform's own stands in: PowerShell on Windows, a POSIX shell elsewhere.
 */
export const readCommand = (
  payload: object,
  cursorEvent: CursorEvent,
  platform: NodeJS.Platform = process.platform,
): CommandInput | undefined => {
  const host = hostOf(payload);
  if (host === 'cursor' && stringAt(payload, 'hook_event_name') !== cursorEvent) {
    return undefined;
  }
  const command = stringAt(toolInputOf(payload, host), 'command') ?? stringAt(payload, 'command');
  if (command === undefined) {
    return undefined;
  }
  const tool = stringAt(payload, 'tool_name') ?? stringAt(payload, 'toolName');
  const powershell = host === 'cursor' ? platform === 'win32' : tool?.toLowerCase() === 'powershell';
  return {
    host,
    command,
    dialect: powershell ? 'powershell' : 'bash',
  };
};

/**
 * Claude Code names the file, Copilot names its `path`, and Codex's apply_patch carries the patch text, whose Add and
 * Update headers name them. Cursor documents no file path on the one edit event that can answer the agent, so a
 * Cursor payload is not read.
 */
export const readEdit = (payload: object): EditInput | undefined => {
  const host = hostOf(payload);
  if (host === 'cursor') {
    return undefined;
  }
  const input = toolInputOf(payload, host);
  const named = [
    stringAt(input, 'file_path'),
    stringAt(input, 'path'),
    stringAt(valueAt(payload, 'tool_response'), 'filePath'),
  ];
  const patch = stringAt(input, 'command') ?? stringAt(input, 'patch') ?? (typeof input === 'string' ? input : '');
  const patched = patch.split(/\r?\n/u).map((line) => {
    return PATCHED_FILE.exec(line)?.[1];
  });

  return {
    host,
    cwd: stringAt(payload, 'cwd') ?? '',
    paths: [...named, ...patched].filter((path) => {
      return path !== undefined;
    }),
  };
};

const cursorDecision = (kind: DecisionKind, text: string): object => {
  return kind === 'deny'
    ? {
        permission: 'deny',
        user_message: text,
        agent_message: text,
      }
    : { additional_context: text };
};

const copilotDecision = (kind: DecisionKind, text: string): object => {
  return kind === 'deny'
    ? {
        permissionDecision: 'deny',
        permissionDecisionReason: text,
      }
    : { additionalContext: text };
};

const claudeDecision = (kind: DecisionKind, text: string): object => {
  if (kind === 'block') {
    return {
      decision: 'block',
      reason: text,
    };
  }
  return {
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
};

// The decision in the host's own words, or nothing when there is none to make. Cursor's shell gate is the one that
// answers a clear command too: its own examples print an explicit allow rather than an empty stdout.
export const decisionOf = (host: Host, kind: DecisionKind, text: string | undefined): object | undefined => {
  if (text === undefined) {
    return host === 'cursor' && kind === 'deny' ? { permission: 'allow' } : undefined;
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
