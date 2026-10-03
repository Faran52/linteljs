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
    const expected = [['[ERROR] failed'], ['Error details: boom']];
    expect(error.mock.calls).toStrictEqual(expected);

    vi.stubEnv('DEBUG', 'true');
    error.mockClear();
    logDebug('shown');
    logError('failed', new Error('boom'));

    expect(out).toHaveBeenCalledWith('[DEBUG] shown');
    expect(error).toHaveBeenCalledTimes(3);
  });

  it('prints an error with no cause as its message alone', () => {
    const error = vi.spyOn(console, 'error').mockReturnValue();

    logError('failed');

    const expected = [['[ERROR] failed']];
    expect(error.mock.calls).toStrictEqual(expected);
  });
});
