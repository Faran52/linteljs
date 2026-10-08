// A gate step is skipped only when every file it could read, the toolchain and the env match its last pass, so
// one key covers the whole program: a type changed in one file reruns the step that fails in another.
import { execFileSync } from 'node:child_process';
import { createHash, type Hash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { version } from 'node:process';

import { resolvedBinary } from '@spawns/utils/binaryUtils';

export interface StepInputs {
  // Extensions the step never reads, left out of its key.
  excluded: readonly string[];
  // Gitignored paths the step reads all the same, files or directories.
  ignored: readonly string[];
  env: Record<string, string | undefined>;
}

const ENV_KEYS = /^(?:LINTELJS_|NODE_|LANG$|LC_|TZ$)/u;

// The gate's own switches decide what runs, not what a step sees.
const GATE_PREFIX = 'LINTELJS_GATE_';

const MISSING = 'missing';

const byName = (left: string, right: string): number => {
  return left.localeCompare(right);
};

const add = (hash: Hash, path: string, content: Buffer | string): void => {
  hash.update(`${path}\0${String(content.length)}\0`);
  hash.update(content);
};

const isDirectory = (path: string): boolean => {
  const stats = statSync(path);

  return stats.isDirectory();
};

const addPath = (hash: Hash, root: string, path: string): void => {
  const full = join(root, path);

  if (!existsSync(full)) {
    add(hash, path, MISSING);

    return;
  }

  const inside = isDirectory(full)
    ? readdirSync(full, { recursive: true })
        .map(String)
        .toSorted(byName)
        .map((entry) => {
          return join(path, entry);
        })
    : [path];

  for (const file of inside) {
    const at = join(root, file);
    const content = isDirectory(at) ? MISSING : readFileSync(at);

    add(hash, file, content);
  }
};

// Every tracked and untracked file git does not ignore, deleted ones included, so nothing new slips past.
const filesOf = (root: string): string[] => {
  const git = String(resolvedBinary('git'));
  const listed = execFileSync(git, [
    'ls-files',
    '-z',
    '-co',
    '--exclude-standard',
    '--deduplicate',
  ], {
    cwd: root,
    encoding: 'utf8',
  });

  return listed
    .split('\0')
    .filter(Boolean)
    .toSorted(byName);
};

export const stepKeyOf = (root: string, step: string, inputs: StepInputs): string => {
  const hash = createHash('sha256');
  const files = filesOf(root)
    .filter((file) => {
      return !inputs.excluded
        .some((extension) => {
          return file.endsWith(extension);
        });
    });
  const names = Object.keys(inputs.env)
    .filter((name) => {
      return ENV_KEYS.test(name) && !name.startsWith(GATE_PREFIX);
    })
    .toSorted(byName);

  add(hash, 'step', step);
  add(hash, 'node', version);
  add(hash, 'manager', inputs.env['npm_config_user_agent'] ?? MISSING);

  for (const name of names) {
    add(hash, `env ${name}`, inputs.env[name] ?? MISSING);
  }

  const paths = [...files, ...inputs.ignored];

  for (const path of paths) {
    addPath(hash, root, path);
  }

  return hash.digest('hex');
};

const keyPath = (directory: string, step: string): string => {
  return join(directory, `${step.replaceAll(':', '-')}.key`);
};

export const isCached = (directory: string, step: string, key: string): boolean => {
  const path = keyPath(directory, step);

  return existsSync(path) && readFileSync(path, 'utf8') === key;
};

export const recordPass = (directory: string, step: string, key: string): void => {
  const path = keyPath(directory, step);

  mkdirSync(directory, { recursive: true });
  writeFileSync(path, key);
};
