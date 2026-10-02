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

import { TEMPLATES_ROOT } from '../../../src/disk';

interface RunResult {
  status: number | null;
  output: string;
}

const CHECKER = join(TEMPLATES_ROOT, 'project/scripts/typecheckStaged.ts');

const TSC = join(TEMPLATES_ROOT, '../../../node_modules/.bin/tsc');

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
  const prefix = join(tmpdir(), 'linteljs-typecheck-');
  cwd = await mkdtemp(prefix);
  await writeFile(join(cwd, 'tsconfig.json'), TSCONFIG, 'utf8');
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const ESCAPE = String.fromCharCode(27);

const plain = (text: string): string => {
  return text
    .split(`${ESCAPE}[`)
    .map((part, index) => {
      return index === 0 ? part : part.replace(/^[0-9;]*m/u, '');
    })
    .join('');
};

const run = (staged: string[]): RunResult => {
  const result = spawnSync(execPath, [CHECKER, ...staged], {
    encoding: 'utf8',
    cwd,
    env: {
      ...process.env,
      TYPECHECK_COMMAND: `${TSC} --noEmit -p tsconfig.json`,
    },
  });

  const outcome: RunResult = {
    status: result.status,
    output: plain(`${result.stdout}${result.stderr}`),
  };
  return outcome;
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
    const exists = existsSync(sentinel);
    expect(exists).toBe(false);
  });

  it('passes through a project error that belongs to an unstaged file', async () => {
    await writeFile(join(cwd, 'clean.ts'), 'export const value: number = 1;\n', 'utf8');
    await writeFile(join(cwd, 'broken.ts'), "export const value: number = 'nope';\n", 'utf8');

    expect(run(['clean.ts']).status).toBe(0);
  }, 30000);
});
