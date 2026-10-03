// Tells the user once when the main session's context passes the ceiling, and again only after it drops back under.
import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CONTEXT_CEILING_TOKENS, TOKENS_PER_K } from './constants.ts';
import { contextOf } from './utils/contextUtils.ts';
import { readPayload, readSession } from './utils/hostUtils.ts';

const CEILING = `${String(CONTEXT_CEILING_TOKENS / TOKENS_PER_K)}K`;

// The plugin data directory outlives an update; outside a plugin, tmp serves.
const markerOf = (session: string): string => {
  const directory = process.env['CLAUDE_PLUGIN_DATA'] ?? tmpdir();
  mkdirSync(directory, { recursive: true });
  return join(directory, `linteljs-context-${session}`);
};

const warningOf = (tokens: number): object => {
  const thousands = Math.floor(tokens / TOKENS_PER_K);
  const size = `${String(thousands)}K`;
  const warning = {
    systemMessage: `Context passed ${CEILING} (${size}). Consider /compact or a fresh session.`,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `Context is ${size}, past ${CEILING}. Tell the user so in one line, and keep replies lean.`,
    },
  };

  return warning;
};

const payload = readPayload();
const input = payload === undefined ? undefined : readSession(payload);

if (input !== undefined) {
  const tokens = contextOf(input.transcript);
  const marker = markerOf(input.session);

  if (tokens < CONTEXT_CEILING_TOKENS) {
    rmSync(marker, { force: true });
  }
  else if (!existsSync(marker)) {
    writeFileSync(marker, '');
    const warning = warningOf(tokens);

    process.stdout.write(`${JSON.stringify(warning)}\n`);
  }
}
