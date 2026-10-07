import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { checkedProject } from '@mocks/checkedProject';
import { spawnHook } from '@mocks/runHook';
import {
  describe,
  expect,
  it,
} from 'vitest';

describe('checkStatusHook.ts', () => {
  it('prints the state of the project it runs in, and nothing outside one', () => {
    const root = checkedProject();
    const prefix = join(tmpdir(), 'linteljs-unchecked-');
    const outside = mkdtempSync(prefix);
    const inside = spawnHook('checkStatusHook.ts', '', undefined, undefined, root);
    const elsewhere = spawnHook('checkStatusHook.ts', '', undefined, undefined, outside);

    rmSync(root, {
      force: true,
      recursive: true,
    });

    rmSync(outside, {
      force: true,
      recursive: true,
    });

    expect(inside).toBe('none');
    expect(elsewhere).toBe('');
  });
});
