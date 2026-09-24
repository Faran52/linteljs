// Runs the type floor over every package's source, which lint-staged only ever hands the staged slice of.
import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';
import process, { execPath } from 'node:process';

const files = globSync('packages/*/{src,__mocks__}/**/*.{ts,mts,cts}');

// The absolute interpreter rather than `node`, so nothing resolves off `PATH`.
process.exitCode = spawnSync(execPath, ['scripts/checkBannedPatterns.ts', ...files], { stdio: 'inherit' }).status ?? 1;
