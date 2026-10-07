import { rmSync } from 'node:fs';

import { checkedProject, shellPayload } from '@mocks/checkedProject';
import { spawnHook } from '@mocks/runHook';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

let root = '';

const stateAfter = (event: string): string => {
  spawnHook('commitGateHook.ts', shellPayload(root, 'pnpm check'));
  const recorded = spawnHook('checkRecordHook.ts', shellPayload(root, 'pnpm check', event));
  const state = spawnHook('checkStatusHook.ts', '', undefined, undefined, root);

  expect(recorded).toBe('');

  return state;
};

beforeEach(() => {
  root = checkedProject();
});

afterEach(() => {
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe('checkRecordHook.ts', () => {
  it.each([
    ['PostToolUse', 'passed'],
    ['PostToolUseFailure', 'failed'],
  ])('records a check that ends in %s as %s', (event, expected) => {
    const state = stateAfter(event);
    expect(state).toBe(expected);
  });

  it('records a check run as `cd <dir> && <check>` against <dir>', () => {
    const check = `cd ${root} && pnpm check`;
    spawnHook('commitGateHook.ts', shellPayload('/', check));
    spawnHook('checkRecordHook.ts', shellPayload('/', check, 'PostToolUse'));
    const state = spawnHook('checkStatusHook.ts', '', undefined, undefined, root);
    expect(state).toBe('passed');
  });

  it('stays silent on malformed JSON', () => {
    const reply = spawnHook('checkRecordHook.ts', '{');
    expect(reply).toBe('');
  });
});
