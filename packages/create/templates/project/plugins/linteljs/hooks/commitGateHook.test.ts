import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { checkedProject, shellPayload } from '@mocks/checkedProject';
import {
  copilotPayload,
  cursorShellPayload,
  runHook,
  spawnHook,
} from '@mocks/runHook';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

let root = '';

beforeEach(() => {
  root = checkedProject();
});

afterEach(() => {
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe('commitGateHook.ts', () => {
  it('holds a commit until `check` has passed on the same files', () => {
    const held = runHook('commitGateHook.ts', shellPayload(root, 'git commit -m x'));
    runHook('commitGateHook.ts', shellPayload(root, 'pnpm check > /tmp/check.log 2>&1'));
    spawnHook('checkRecordHook.ts', shellPayload(root, 'pnpm check > /tmp/check.log 2>&1', 'PostToolUse'));
    const passed = runHook('commitGateHook.ts', shellPayload(root, 'git commit -m x'));

    expect(held).toMatch(/^Commit held: `pnpm check` has not passed on these files \(it has not run/u);
    expect(passed).toBeUndefined();
  });

  it('judges a commit and a check run from another directory on the checkout they name', () => {
    const elsewhere = tmpdir();
    const check = `cd ${root} && pnpm check > /tmp/check.log 2>&1`;
    const held = runHook('commitGateHook.ts', shellPayload(elsewhere, `git -C ${root} commit -m x`));
    runHook('commitGateHook.ts', shellPayload(elsewhere, check));
    spawnHook('checkRecordHook.ts', shellPayload(elsewhere, check, 'PostToolUse'));
    const moved = runHook('commitGateHook.ts', shellPayload(elsewhere, `cd ${root} && git commit -m x`));
    const named = runHook('commitGateHook.ts', shellPayload(elsewhere, `git -C ${root} commit -m x`));

    expect(held).toMatch(/^Commit held: /u);
    expect(moved).toBeUndefined();
    expect(named).toBeUndefined();
  });

  it('lets a command that commits nothing through', () => {
    const reply = runHook('commitGateHook.ts', shellPayload(root, 'git status'));
    expect(reply).toBeUndefined();
  });

  it('stays silent on malformed JSON, and under Copilot and Cursor', () => {
    const malformed = runHook('commitGateHook.ts', '{');
    const copilot = runHook('commitGateHook.ts', copilotPayload('bash', { command: 'git commit' }, root));
    const cursor = runHook('commitGateHook.ts', cursorShellPayload('git commit'));

    expect([
      malformed,
      copilot,
      cursor,
    ]).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });
});
