import {
  delimiter,
  join,
  resolve,
} from 'node:path';
import { env } from 'node:process';

import { isExecutableFile } from '@disk';

// From PATH, so `sync` can run it from another cwd and a same-named directory is not mistaken for it.
export const resolvedBinary = (name: string): string | undefined => {
  const path = env['PATH'];

  if (path === undefined) {
    return undefined;
  }

  for (const directory of path.split(delimiter)) {
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
