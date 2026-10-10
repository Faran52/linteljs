// The shipped check band's suite. `claude plugin test` takes only a folder and runs every suite in it, so it gets a
// copy of the shipped plugin without the Node hook suites.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import {
  CLAUDE,
  NODE_SUITE,
  PLUGIN_DIR,
} from './constants.ts';

const prefix = join(tmpdir(), 'linteljs-band-');
const temp = mkdtempSync(prefix);
const copy = join(temp, 'linteljs');

cpSync(PLUGIN_DIR, copy, {
  recursive: true,
  filter: (source) => {
    return !NODE_SUITE.test(source);
  },
});

const { status } = spawnSync(CLAUDE, [
  'plugin',
  'test',
  copy,
], { stdio: 'inherit' });

rmSync(temp, {
  recursive: true,
  force: true,
});

process.exitCode = status ?? 1;
