import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { execPath } from 'node:process';

const EXTENSIONS = new Set(['.ts', '.mts', '.cts']);

const filesUnder = (dir: string): string[] => {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => {
      return entry.isFile() && EXTENSIONS.has(extname(entry.name));
    })
    .map((entry) => {
      return join(entry.parentPath, entry.name);
    });
};

const packageNames = readdirSync('packages', { withFileTypes: true })
  .filter((entry) => {
    return entry.isDirectory();
  })
  .map((entry) => {
    return entry.name;
  });

const files = packageNames.flatMap((name) => {
  return [
    ...filesUnder(join('packages', name, 'src')),
    ...filesUnder(join('packages', name, '__mocks__')),
  ];
});

// `checkBannedPatterns.ts` skips its own directory, so this never scans itself. The absolute interpreter path,
// not `'node'`, so this never resolves an executable off `PATH`.
const result = spawnSync(execPath, ['scripts/checkBannedPatterns.ts', ...files], { stdio: 'inherit' });

process.exitCode = result.status ?? 1;
