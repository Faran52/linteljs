import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execPath } from 'node:process';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { ASSETS_ROOT } from '../../src/run/shipped-assets/shippedAssets';

// Spawned rather than imported: it reads `argv` and calls `exit`, which would take the runner down with it.
const CHECKER = join(ASSETS_ROOT, 'scripts/typecheckStaged.ts');

// Repo-root tsc, not a fixture install: a tmpdir has no node_modules of its own to resolve.
const TSC = join(ASSETS_ROOT, '../../../node_modules/.bin/tsc');

const TSCONFIG = [
  '{',
  '  "compilerOptions": {',
  '    "target": "es2022",',
  '    "module": "esnext",',
  '    "moduleResolution": "bundler",',
  '    "noEmit": true,',
  '    "skipLibCheck": true',
  '  },',
  '  "include": ["*.ts"]',
  '}',
  '',
].join('\n');

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-typecheck-'));
  await writeFile(join(cwd, 'tsconfig.json'), TSCONFIG, 'utf8');
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

/**
 * Colour is decoration, and asserting through it makes a test read the terminal it happens to run in: `tsc` pretty
 * prints `error TS2322` with escapes between the two words, so a run under a coloured terminal failed where CI passed.
 */
const ESCAPE = String.fromCharCode(27);

const plain = (text: string): string => {
  return text.split(`${ESCAPE}[`).map((part, index) => {
    return index === 0 ? part : part.replace(/^[0-9;]*m/u, '');
  }).join('');
};

const run = (staged: string[]): { status: number | null;
  output: string; } => {
  const result = spawnSync(execPath, [CHECKER, ...staged], {
    encoding: 'utf8',
    cwd,
    env: {
      ...process.env,
      TYPECHECK_COMMAND: `${TSC} --noEmit -p tsconfig.json`,
    },
  });

  return {
    status: result.status,
    output: plain(`${result.stdout}${result.stderr}`),
  };
};

describe('a type-clean staged file', () => {
  it('exits 0', async () => {
    await writeFile(join(cwd, 'clean.ts'), 'export const value: number = 1;\n', 'utf8');

    expect(run(['clean.ts']).status).toBe(0);
  }, 30000);
});

describe('a staged file with a real type error', () => {
  it('exits non-zero and reports tsc diagnostics for it', async () => {
    await writeFile(join(cwd, 'broken.ts'), "export const value: number = 'nope';\n", 'utf8');

    const { status, output } = run(['broken.ts']);

    expect(status).not.toBe(0);
    expect(output).toContain('broken.ts');
    expect(output).toContain('error TS2322');
  }, 30000);
});

describe('files it does not check', () => {
  it('skips the typecheck entirely when nothing is staged', () => {
    // The command plants a sentinel, so an invocation is observable rather than inferred.
    const sentinel = join(cwd, 'invoked.txt');
    const result = spawnSync(execPath, [CHECKER], {
      encoding: 'utf8',
      cwd,
      env: {
        ...process.env,
        TYPECHECK_COMMAND: `${execPath} -e "require('node:fs').writeFileSync('invoked.txt', '')"`,
      },
    });

    expect(result.status).toBe(0);
    expect(existsSync(sentinel)).toBe(false);
  });

  it('passes through a project error that belongs to an unstaged file', async () => {
    await writeFile(join(cwd, 'clean.ts'), 'export const value: number = 1;\n', 'utf8');
    await writeFile(join(cwd, 'broken.ts'), "export const value: number = 'nope';\n", 'utf8');

    // The project still fails to typecheck; only broken.ts is unstaged, so nothing is reported.
    expect(run(['clean.ts']).status).toBe(0);
  }, 30000);
});
