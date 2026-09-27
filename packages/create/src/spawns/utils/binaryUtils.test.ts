import {
  chmod,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  delimiter,
  join,
  relative,
} from 'node:path';
import { cwd } from 'node:process';

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { resolvedBinary } from './binaryUtils';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolvedBinary', () => {
  it('answers an absolute path to a binary that is on PATH', () => {
    const resolved = resolvedBinary('node') ?? '';

    expect(resolved).toMatch(/node$/u);
    expect(resolved.startsWith('/')).toBe(true);
  });

  it('answers nothing for a name PATH does not carry', () => {
    expect(resolvedBinary('linteljs-no-such-binary')).toBeUndefined();
  });

  it('answers nothing where PATH is unset', () => {
    vi.stubEnv('PATH', undefined);

    expect(resolvedBinary('node')).toBeUndefined();
  });

  it('skips an empty PATH entry rather than reading it as the working directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'linteljs-binary-'));

    try {
      await writeFile(join(dir, 'tool'), '', 'utf8');
      await chmod(join(dir, 'tool'), 0o755);

      vi.stubEnv('PATH', dir);
      expect(resolvedBinary('tool')).toBe(join(dir, 'tool'));

      vi.stubEnv('PATH', delimiter);
      expect(resolvedBinary(relative(cwd(), join(dir, 'tool')))).toBeUndefined();
    }
    finally {
      await rm(dir, {
        recursive: true,
        force: true,
      });
    }
  });
});
