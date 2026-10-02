import {
  chmod,
  mkdir,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { execPath } from 'node:process';

import { vi } from 'vitest';

// `PATH` holds only this directory and node's own, so no installed manager answers for another.
export const plantBinary = async (dir: string, name: string, body: string[]): Promise<void> => {
  await mkdir(dir, { recursive: true });
  const binary = join(dir, name);
  const script = ['#!/usr/bin/env node', ...body].join('\n');

  await writeFile(binary, script, 'utf8');
  await chmod(binary, 0o755);
  vi.stubEnv('PATH', `${dir}:${dirname(execPath)}`);
};
