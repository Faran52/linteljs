import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  accessSync,
  constants,
  statSync,
} from 'node:fs';
import {
  delimiter,
  join,
  resolve,
} from 'node:path';
import { env } from 'node:process';

export interface GitOptions {
  cwd: string;
  // Fed on stdin: `git diff --no-index -` reads the shipped file from it.
  input?: string;
}

// Resolve `git` from PATH so `sync` can run it from another cwd; reject executable directories.
const resolvedGit = (): string | undefined => {
  for (const directory of (env['PATH'] ?? '').split(delimiter)) {
    if (directory === '') {
      continue;
    }

    const candidate = resolve(join(directory, 'git'));

    try {
      accessSync(candidate, constants.X_OK);

      if (statSync(candidate).isFile()) {
        return candidate;
      }
    }
    catch {
    }
  }

  return undefined;
};

// `sync` degrades to a change without a diff when Git is unavailable.
export const git = (args: string[], options: GitOptions): SpawnSyncReturns<string> => {
  const binary = resolvedGit();

  if (binary === undefined) {
    return {
      pid: 0,
      output: [null, '', ''],
      stdout: '',
      stderr: '',
      status: null,
      signal: null,
      error: new Error('git was not found on PATH, and the hooks this tool installs need one.'),
    };
  }

  return spawnSync(binary, args, {
    ...options,
    encoding: 'utf8',
  });
};
