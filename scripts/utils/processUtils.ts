import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';

// stderr passes through, so a failing command explains itself.
export const run = (command: string, args: string[], cwd: string): string => {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: [
      'ignore',
      'pipe',
      'inherit',
    ],
  });
};

const emptyDir = (dir: string): void => {
  rmSync(dir, {
    recursive: true,
    force: true,
  });
  mkdirSync(dir, { recursive: true });
};

// `pnpm pack` runs `prepack` and rewrites `catalog:` the way a publish does.
export const packTarball = (packageDir: string, outDir: string): string => {
  emptyDir(outDir);
  run('pnpm', [
    'pack',
    '--pack-destination',
    outDir,
  ], packageDir);

  const tarball = readdirSync(outDir)
    .find((file) => {
      return file.endsWith('.tgz');
    });

  if (tarball === undefined) {
    throw new Error(`pnpm pack wrote no tarball into ${outDir}`);
  }

  return join(outDir, tarball);
};

export const unpackTarball = (packageDir: string, outDir: string): string => {
  run('tar', ['-xzf', packTarball(packageDir, outDir)], outDir);

  return join(outDir, 'package');
};
