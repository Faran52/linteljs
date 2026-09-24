import {
  delimiter,
  join,
  resolve,
} from 'node:path';
import { env } from 'node:process';

import { isExecutableFile } from '#disk';

// Resolved from PATH rather than spawned by name, so `sync` can run it from another cwd and a directory that merely
// carries the name is not mistaken for the binary. Executable directories are rejected.
export const resolvedBinary = (name: string): string | undefined => {
  for (const directory of (env['PATH'] ?? '').split(delimiter)) {
    if (directory === '') {
      continue;
    }

    const candidate = resolve(join(directory, name));

    if (isExecutableFile(candidate)) {
      return candidate;
    }
  }

  return undefined;
};
