import { OUTPUT_TAIL_LINES } from '../constants';

import { type Exit, failureOf } from './failureUtils';

const exitOf = (overrides: Partial<Exit>): Exit => {
  const exit: Exit = {
    code: 1,
    signal: null,
    stdout: '',
    stderr: '',
    ...overrides,
  };

  return exit;
};

describe('failureOf', () => {
  it('prints both streams under the exit code', () => {
    const exit = exitOf({
      stdout: 'src/a.ts\n  1:1  error  bad\n',
      stderr: 'ESLint found too many warnings\n',
    });
    const actual = failureOf(exit);

    expect(actual).toBe('failed (exit 1)\nsrc/a.ts\n  1:1  error  bad\nESLint found too many warnings');
  });

  it('names a kill pnpm reports as 128 plus the signal, and says it is no failure of the step', () => {
    const exit = exitOf({ code: 143 });
    const actual = failureOf(exit);

    expect(actual).toBe('killed by SIGTERM, not a failure of its own: rerun it\n(no output)');
  });

  it('names a kill reported as a signal', () => {
    const exit = exitOf({
      code: null,
      signal: 'SIGKILL',
    });
    const actual = failureOf(exit);

    expect(actual).toBe('killed by SIGKILL, not a failure of its own: rerun it\n(no output)');
  });

  it('reads an exit code past every signal, or none, as a failure', () => {
    const past = failureOf(exitOf({ code: 255 }));
    const spawnError = failureOf(exitOf({ code: 'ENOENT' }));

    expect(past).toBe('failed (exit 255)\n(no output)');
    expect(spawnError).toBe('failed (exit ENOENT)\n(no output)');
  });

  it('keeps the tail of a long stream and counts what it cut', () => {
    const lines = Array.from({ length: OUTPUT_TAIL_LINES + 2 }, (_, index) => {
      return `line ${String(index)}`;
    });
    const stdout = lines.join('\n');
    const kept = lines.slice(2);
    const exit = exitOf({ stdout });
    const actual = failureOf(exit)
      .split('\n');
    const expected = [
      'failed (exit 1)',
      '(2 earlier lines cut)',
      ...kept,
    ];

    expect(actual).toStrictEqual(expected);
  });
});
