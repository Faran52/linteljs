import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { parsePackageJson } from '../emitters/always/package-json/packageJsonEmitter';

import { PACKAGE_MANAGER_VERSIONS } from './engines';

// `^`, `~` and a release-candidate suffix all name the same floor.
const floorOf = (range: string): number[] => {
  return range.replace(/^[\^~]/u, '').replace(/-rc\.\d+/u, '').split('.').map(Number);
};

const atLeast = (range: string, minimum: string): boolean => {
  const left = floorOf(range);
  const right = floorOf(minimum);

  return left.every((part, index) => {
    const other = right[index] ?? 0;

    return part === other || part > other || left.slice(0, index).some((earlier, at) => {
      return earlier > (right[at] ?? 0);
    });
  });
};

describe('PACKAGE_MANAGER_VERSIONS against the workspace', () => {
  // A project told to use a pnpm older than the one this repository develops on is a project this repository
  // has never run its own gate against.
  it('pins pnpm no older than the one this workspace runs', () => {
    const path = join(import.meta.dirname, '..', '..', '..', '..', 'package.json');
    const { packageManager } = parsePackageJson(readFileSync(path, 'utf8'));
    const running = String(packageManager).replace('pnpm@', '');

    expect(atLeast(PACKAGE_MANAGER_VERSIONS.pnpm, running)).toBe(true);
  });
});
