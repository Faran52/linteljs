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
    const actual = resolved.startsWith('/');
    expect(actual).toBe(true);
  });

  it('answers nothing for a name PATH does not carry', () => {
    const actual = resolvedBinary('linteljs-no-such-binary');
    expect(actual).toBeUndefined();
  });

  it('answers nothing where PATH is unset', () => {
    vi.stubEnv('PATH', undefined);

    const actual = resolvedBinary('node');
    expect(actual).toBeUndefined();
  });

  it('skips an empty PATH entry rather than reading it as the working directory', async () => {
    const prefix = join(tmpdir(), 'linteljs-binary-');
    const dir = await mkdtemp(prefix);

    try {
      await writeFile(join(dir, 'tool'), '', 'utf8');
      await chmod(join(dir, 'tool'), 0o755);

      vi.stubEnv('PATH', dir);
      const onPath = resolvedBinary('tool');
      expect(onPath).toBe(join(dir, 'tool'));

      vi.stubEnv('PATH', delimiter);
      const relativeTool = relative(cwd(), join(dir, 'tool'));
      const fromEmptyEntry = resolvedBinary(relativeTool);
      expect(fromEmptyEntry).toBeUndefined();
    }
    finally {
      await rm(dir, {
        recursive: true,
        force: true,
      });
    }
  });
});
