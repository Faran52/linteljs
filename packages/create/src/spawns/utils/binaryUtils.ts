import {
  delimiter,
  join,
  resolve,
} from 'node:path';
import { env } from 'node:process';

import { isExecutableFile } from '@disk';

// From PATH, so `sync` can run it from another cwd and a same-named directory is not mistaken for it.
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
