import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  type Dominant,
  showTiming,
  type Timing,
} from './timingUtils.ts';

const dominant = (file: string): Dominant => {
  const answer = {
    baseline: 0.5,
    ms: 1.25,
    rule: `rule-of-${file}`,
  };

  return answer;
};

const reportFor = (timings: Timing[], wallMs = 4000): string => {
  const log = vi.spyOn(console, 'log').mockReturnValue();

  showTiming(timings, wallMs, dominant);

  const report = log.mock.calls
    .flat()
    .join('\n');

  return report;
};

const many = (count: number, bytes: number, ms: number): Timing[] => {
  const timings = Array.from({ length: count }, (_, index) => {
    const timing = {
      bytes,
      file: `f${String(bytes)}-${String(index)}.ts`,
      ms,
    };

    return timing;
  });

  return timings;
};

describe('showTiming', () => {
  it('warns and logs nothing when no file was linted', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue();
    const log = vi.spyOn(console, 'log').mockReturnValue();

    showTiming([], 0, dominant);

    expect(warn).toHaveBeenCalledWith('[WARN] no file was linted, so there is nothing to time');
    expect(log).not.toHaveBeenCalled();
  });

  it('reports totals, buckets, the verdict and the slowest files', () => {
    const timings = [
      {
        bytes: 512,
        file: 'a.ts',
        ms: 1,
      },
      {
        bytes: 2048,
        file: 'b.ts',
        ms: 3,
      },
      {
        bytes: 1024,
        file: 'c.ts',
        ms: 2,
      },
    ];

    const report = reportFor(timings);

    const expected = [
      '[INFO] timing: one whole-plugin --fix pass per linted file, the audit pass excluded',
      '  3 files in 0.0s of fix time, 500.0 files/s (4.0s wall, the rest is reading, parsing and the audit)',
      '  per file: median 2.00ms, p99 3.00ms, slowest 3.00ms',
      '  time per byte by size:',
      '    size            files   median ms   ns/byte',
      '    under 1 KiB         1        1.00      1953',
      '    1 to 4 KiB          2        3.00      1953',
      '  too few files per size bucket to say whether time per byte climbs (need 20)',
      '  slowest 20, with the rule that dominates each:',
      '         3.0ms     2.0 KiB   1465 ns/byte  rule-of-b.ts 1.3ms over a 0.5ms parse',
      '      b.ts',
      '         2.0ms     1.0 KiB   1953 ns/byte  rule-of-c.ts 1.3ms over a 0.5ms parse',
      '      c.ts',
      '         1.0ms     0.5 KiB   1953 ns/byte  rule-of-a.ts 1.3ms over a 0.5ms parse',
      '      a.ts',
    ].join('\n');
    expect(report).toBe(expected);
  });

  it('flags time per byte that climbs past three times the cheapest bucket', () => {
    const timings = [...many(20, 512, 0.5), ...many(20, 100_000, 400)];

    const report = reportFor(timings);

    expect(report).toContain('  ! superlinear: 64 to 256 KiB costs 4.10x the ns/byte of the cheapest bucket, '
      + 'under 1 KiB. A rule scaling worse than the text does looks exactly like this.');
  });

  it('passes time per byte that holds within three times', () => {
    const timings = [...many(20, 512, 0.5), ...many(20, 100_000, 200)];

    const report = reportFor(timings);

    expect(report).toContain('  time per byte does not climb with size (64 to 256 KiB costs 2.05x the ns/byte of '
      + 'the cheapest bucket, under 1 KiB), so nothing here looks superlinear');
  });

  it('names the largest bucket when it is also the cheapest', () => {
    const timings = [...many(20, 512, 5), ...many(20, 100_000, 10)];

    const report = reportFor(timings);

    expect(report).toContain('(64 to 256 KiB, the largest bucket with a stable median, is also the cheapest per byte)');
  });

  it('lists files far slower per byte than the median, slowest first', () => {
    const timings = [
      ...many(5, 8192, 2),
      ...many(1, 4096, 100),
      ...many(1, 5000, 200),
      ...many(1, 4095, 500),
      ...many(1, 9000, 1),
    ];

    const report = reportFor(timings);

    const outliers = report
      .split('\n')
      .slice(-3);

    expect(outliers).toEqual([
      '  2 timing outlier(s): over 25x the median 244 ns/byte, among files over 4096 bytes and 2ms',
      '    ! 200.0ms 4.9 KiB 40000 ns/byte  f5000-0.ts',
      '    ! 100.0ms 4.0 KiB 24414 ns/byte  f4096-0.ts',
    ]);
  });
});
