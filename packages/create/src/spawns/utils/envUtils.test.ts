import { execFileSync } from 'node:child_process';

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { resolvedBinary } from './binaryUtils';
import { repositoryFreeEnv } from './envUtils';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('repositoryFreeEnv', () => {
  it('drops every variable git itself names as locating a repository', () => {
    const git = String(resolvedBinary('git'));
    const named = execFileSync(git, ['rev-parse', '--local-env-vars'], { encoding: 'utf8' })
      .trim()
      .split('\n');

    for (const name of named) {
      vi.stubEnv(name, '/elsewhere');
    }

    const freeEnv = repositoryFreeEnv();
    const left = Object.keys(freeEnv)
      .filter((name) => {
        return named.includes(name);
      });

    expect(named).toContain('GIT_DIR');
    expect(left).toEqual([]);
  });

  it('keeps the rest of the environment', () => {
    vi.stubEnv('LINTELJS_KEPT', 'yes');
    vi.stubEnv('GIT_EDITOR', 'true');

    const free = repositoryFreeEnv();

    expect(free['LINTELJS_KEPT']).toBe('yes');
    expect(free['GIT_EDITOR']).toBe('true');
  });
});
