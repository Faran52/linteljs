import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  log,
  logDebug,
  logError,
  logWarn,
} from './loggerUtils';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('loggerUtils', () => {
  it('prefixes each level on its own stream', () => {
    const out = vi.spyOn(console, 'log').mockReturnValue();
    const warn = vi.spyOn(console, 'warn').mockReturnValue();

    log('built');
    logWarn('slow');

    expect(out).toHaveBeenCalledWith('[INFO] built');
    expect(warn).toHaveBeenCalledWith('[WARN] slow');
  });

  it('prints debug lines and stack traces only under DEBUG=true', () => {
    const out = vi.spyOn(console, 'log').mockReturnValue();
    const error = vi.spyOn(console, 'error').mockReturnValue();

    logDebug('hidden');
    logError('failed', new Error('boom'));

    expect(out).not.toHaveBeenCalled();
    expect(error.mock.calls).toStrictEqual([['[ERROR] failed'], ['Error details: boom']]);

    vi.stubEnv('DEBUG', 'true');
    error.mockClear();
    logDebug('shown');
    logError('failed', new Error('boom'));

    expect(out).toHaveBeenCalledWith('[DEBUG] shown');
    expect(error).toHaveBeenCalledTimes(3);
  });

  // The workspace runs the copy generated projects receive, so the two cannot drift.
  it('is the file the workspace root runs', () => {
    const root = join(import.meta.dirname, '../../../../../..');

    expect(readFileSync(join(root, 'scripts/utils/loggerUtils.ts'), 'utf8'))
      .toBe(readFileSync(join(import.meta.dirname, 'loggerUtils.ts'), 'utf8'));
  });
});
