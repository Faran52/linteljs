// Tells the user once when the main session's context passes the ceiling.
import { tmpdir } from 'node:os';

import { contextWarningOf } from './utils/contextUtils.ts';
import { readPayload, readSession } from './utils/hostUtils.ts';

const payload = readPayload();
const input = payload === undefined ? undefined : readSession(payload);
// The plugin data directory outlives an update; outside a plugin, tmp serves.
const directory = process.env['CLAUDE_PLUGIN_DATA'] ?? tmpdir();
const warning = input === undefined ? undefined : contextWarningOf(input, directory);

if (warning !== undefined) {
  process.stdout.write(`${JSON.stringify(warning)}\n`);
}
