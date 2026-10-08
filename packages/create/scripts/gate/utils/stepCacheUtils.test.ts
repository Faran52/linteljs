import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import ts from 'typescript';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  isCached,
  recordPass,
  type StepInputs,
  stepKeyOf,
} from './stepCacheUtils.ts';

const INPUTS: StepInputs = {
  excluded: ['.md'],
  ignored: ['types', 'lock.yaml'],
  env: { npm_config_user_agent: 'pnpm/12.9.0' },
};

const GIT = '/usr/bin/git';

let root: string;
let cache: string;

const write = (path: string, text: string): void => {
  const full = join(root, path);

  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, text);
};

const keyOf = (inputs: Partial<StepInputs> = {}, step = 'typecheck'): string => {
  const key = stepKeyOf(root, step, {
    ...INPUTS,
    ...inputs,
  });

  return key;
};

// The whole program, as `tsc --noEmit` would check it.
const typecheck = (): boolean => {
  const program = ts.createProgram([join(root, 'b.ts')], {
    allowImportingTsExtensions: true,
    noEmit: true,
    strict: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);

  return diagnostics.length === 0;
};

// What the gate does with a step.
const gate = (): string => {
  const key = keyOf();

  if (isCached(cache, 'typecheck', key)) {
    return 'cached';
  }

  const passed = typecheck();

  if (passed) {
    recordPass(cache, 'typecheck', key);
  }

  return passed ? 'passed' : 'failed';
};

beforeEach(() => {
  const prefix = join(tmpdir(), 'step-cache-');

  root = mkdtempSync(prefix);
  cache = join(root, 'node_modules', '.cache');
  execFileSync(GIT, ['init', '-q'], { cwd: root });
  write('.gitignore', 'node_modules/\ntypes/\nlock.yaml\nignored.ts\n');
  write('a.ts', 'export type Id = string;\n');
  write('b.ts', 'import type { Id } from \'./a.ts\';\n\nexport const id: Id = \'one\';\n');
});

afterEach(() => {
  rmSync(root, {
    recursive: true,
    force: true,
  });
});

describe('the gate over a step key', () => {
  it('reruns and fails a typed step when only a type in another file changes', () => {
    const first = gate();
    const second = gate();

    write('a.ts', 'export type Id = number;\n');

    const third = gate();
    const fourth = gate();

    expect([
      first,
      second,
      third,
      fourth,
    ]).toStrictEqual([
      'passed',
      'cached',
      'failed',
      'failed',
    ]);
  });
});

describe('stepKeyOf', () => {
  it('holds while nothing changes', () => {
    const before = keyOf();
    const after = keyOf();

    expect(after).toBe(before);
  });

  it('changes with an untracked file, and with a tracked one deleted', () => {
    const before = keyOf();

    write('c.ts', 'export {};\n');

    const added = keyOf();

    execFileSync(GIT, ['add', 'c.ts'], { cwd: root });
    rmSync(join(root, 'c.ts'));

    const deleted = keyOf();

    expect(new Set([
      before,
      added,
      deleted,
    ]).size).toBe(3);
  });

  it('leaves out an excluded extension and a gitignored file, but not a listed ignored path', () => {
    const before = keyOf();

    write('README.md', '# notes\n');
    write('ignored.ts', 'export {};\n');

    const unread = keyOf();

    write('types/nested/index.d.ts', 'export {};\n');

    const typed = keyOf();

    write('lock.yaml', 'one\n');

    const locked = keyOf();
    const withMarkdown = keyOf({ excluded: [] });

    expect(unread).toBe(before);

    expect(new Set([
      before,
      typed,
      locked,
      withMarkdown,
    ]).size).toBe(4);
  });

  it('changes with the step, the manager and the env a step sees, not with the gate\'s own switches', () => {
    const before = keyOf();
    const step = keyOf({}, 'lint');
    const manager = keyOf({ env: {} });
    const seen = keyOf({
      env: {
        ...INPUTS.env,
        LINTELJS_STARTERS: 'react',
      },
    });
    const unset = keyOf({
      env: {
        ...INPUTS.env,
        NODE_OPTIONS: undefined,
      },
    });
    const own = keyOf({
      env: {
        ...INPUTS.env,
        LINTELJS_GATE_SKIP: 'lint',
        HOME: '/elsewhere',
      },
    });

    expect(own).toBe(before);

    expect(new Set([
      before,
      step,
      manager,
      seen,
      unset,
    ]).size).toBe(5);
  });
});

describe('isCached', () => {
  it('holds only the key last recorded for that step', () => {
    const before = isCached(cache, 'lint:types', 'one');

    recordPass(cache, 'lint:types', 'one');

    const same = isCached(cache, 'lint:types', 'one');
    const other = isCached(cache, 'lint:types', 'two');
    const step = isCached(cache, 'lint', 'one');

    expect([
      before,
      same,
      other,
      step,
    ]).toStrictEqual([
      false,
      true,
      false,
      false,
    ]);
  });
});
