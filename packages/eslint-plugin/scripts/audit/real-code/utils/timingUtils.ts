import { orderBy, sum } from 'es-toolkit';

import { log, logWarn } from '../../../../../create/templates/project/scripts/utils/loggerUtils.ts';

export interface Timing {
  bytes: number;
  file: string;
  ms: number;
}

export interface Dominant {
  baseline: number;
  ms: number;
  rule: string;
}

interface BucketRow {
  files: number;
  label: string;
  medianMs: number;
  nsPerByte: number;
}

// Below these a ratio measures the harness: a small file's first pass is fixed per-call cost.
const OUTLIER_FLOOR_BYTES = 4096;
const OUTLIER_FLOOR_MS = 2;

// At 25x the median a file's cost is driven by something other than its length.
const OUTLIER_FACTOR = 25;

const SUPERLINEAR_MIN_FILES = 20;
const SUPERLINEAR_RATIO = 3;

const SIZE_BUCKETS: [string, number][] = [
  ['under 1 KiB', 1024],
  ['1 to 4 KiB', 4096],
  ['4 to 16 KiB', 16_384],
  ['16 to 64 KiB', 65_536],
  ['64 to 256 KiB', 262_144],
  ['over 256 KiB', Infinity],
];

// Nearest-rank, so the answer is a time some file took rather than one invented between two.
const quantile = (sorted: number[], fraction: number): number => {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
};

const medianOf = (values: number[]): number => {
  const ascending = [...values]
    .sort((left, right) => {
      return left - right;
    });

  return quantile(ascending, 0.5);
};

const nanosPerByte = (sample: Timing): number => {
  return (sample.ms * 1e6) / sample.bytes;
};

const kib = (bytes: number): string => {
  return `${(bytes / 1024).toFixed(1)} KiB`;
};

const bucketRows = (timings: Timing[]): BucketRow[] => {
  return SIZE_BUCKETS
    .flatMap(([label, limit], index) => {
      const floor = SIZE_BUCKETS[index - 1]?.[1] ?? 0;
      const inBucket = timings
        .filter((sample) => {
          return sample.bytes >= floor && sample.bytes < limit;
        });

      return inBucket.length === 0
        ? []
        : [{
            files: inBucket.length,
            label,
            medianMs: medianOf(inBucket
              .map((sample) => {
                return sample.ms;
              })),
            nsPerByte: medianOf(inBucket.map(nanosPerByte)),
          }];
    });
};

// Time per byte climbing with size is what a quadratic rule looks like from outside. Measured against the cheapest
// bucket, since small files are dominated by fixed cost and anchoring there would hide a climb in the middle.
const superlinearVerdict = (rows: BucketRow[]): string => {
  const usable = rows
    .filter((row) => {
      return row.files >= SUPERLINEAR_MIN_FILES;
    });
  const largest = usable.at(-1);
  const [first] = usable;

  if (usable.length < 2 || largest === undefined || first === undefined) {
    return `too few files per size bucket to say whether time per byte climbs (need ${String(SUPERLINEAR_MIN_FILES)})`;
  }

  const cheapest = usable
    .reduce((best, row) => {
      return row.nsPerByte < best.nsPerByte ? row : best;
    }, first);
  const ratio = largest.nsPerByte / cheapest.nsPerByte;
  const span = largest === cheapest
    ? `${largest.label}, the largest bucket with a stable median, is also the cheapest per byte`
    : `${largest.label} costs ${ratio.toFixed(2)}x the ns/byte of the cheapest bucket, ${cheapest.label}`;

  return ratio > SUPERLINEAR_RATIO
    ? `! superlinear: ${span}. A rule scaling worse than the text does looks exactly like this.`
    : `time per byte does not climb with size (${span}), so nothing here looks superlinear`;
};

// A slow file is not a broken fix, so outliers are printed loudly and never fail the run.
const outlierLines = (timings: Timing[]): string[] => {
  const measurable = timings
    .filter((sample) => {
      return sample.bytes >= OUTLIER_FLOOR_BYTES && sample.ms >= OUTLIER_FLOOR_MS;
    });

  if (measurable.length === 0) {
    return [];
  }

  const median = medianOf(measurable.map(nanosPerByte));
  const slow = measurable
    .filter((sample) => {
      return nanosPerByte(sample) > median * OUTLIER_FACTOR;
    });

  const outliers = orderBy(slow, [nanosPerByte], ['desc']);

  return [
    `${String(outliers.length)} timing outlier(s): over ${String(OUTLIER_FACTOR)}x the median `
    + `${median.toFixed(0)} ns/byte, among files over ${String(OUTLIER_FLOOR_BYTES)} bytes and `
    + `${String(OUTLIER_FLOOR_MS)}ms`,
    ...outliers
      .slice(0, 20)
      .map((sample) => {
        return `  ! ${sample.ms.toFixed(1)}ms ${kib(sample.bytes)} `
          + `${nanosPerByte(sample).toFixed(0)} ns/byte  ${sample.file}`;
      }),
  ];
};

export const showTiming = (timings: Timing[], wallMs: number, dominantRule: (file: string) => Dominant): void => {
  if (timings.length === 0) {
    logWarn('no file was linted, so there is nothing to time');

    return;
  }

  const sortedMs = timings
    .map((sample) => {
      return sample.ms;
    })
    .sort((left, right) => {
      return left - right;
    });
  const lintSeconds = sum(sortedMs) / 1000;
  const rows = bucketRows(timings);
  const slowest = orderBy(timings, ['ms'], ['desc']).slice(0, 20);

  log([
    'timing: one whole-plugin --fix pass per linted file, the audit pass excluded',
    `  ${String(timings.length)} files in ${lintSeconds.toFixed(1)}s of fix time, `
    + `${(timings.length / lintSeconds).toFixed(1)} files/s (${(wallMs / 1000).toFixed(1)}s wall, `
    + 'the rest is reading, parsing and the audit)',
    `  per file: median ${quantile(sortedMs, 0.5).toFixed(2)}ms, p99 ${quantile(sortedMs, 0.99).toFixed(2)}ms, `
    + `slowest ${(sortedMs.at(-1) ?? 0).toFixed(2)}ms`,
    '  time per byte by size:',
    `    ${'size'.padEnd(14)}${'files'.padStart(7)}${'median ms'.padStart(12)}${'ns/byte'.padStart(10)}`,
    ...rows
      .map((row) => {
        return `    ${row.label.padEnd(14)}${String(row.files).padStart(7)}`
          + `${row.medianMs
            .toFixed(2)
            .padStart(12)}${row.nsPerByte
            .toFixed(0)
            .padStart(10)}`;
      }),
    `  ${superlinearVerdict(rows)}`,
    '  slowest 20, with the rule that dominates each:',
    ...slowest
      .flatMap((sample) => {
        const dominant = dominantRule(sample.file);

        return [
          `    ${sample.ms
            .toFixed(1)
            .padStart(8)}ms ${kib(sample.bytes).padStart(11)} `
            + `${nanosPerByte(sample)
              .toFixed(0)
              .padStart(6)} ns/byte  ${dominant.rule} `
              + `${dominant.ms.toFixed(1)}ms over a ${dominant.baseline.toFixed(1)}ms parse`,
          `      ${sample.file}`,
        ];
      }),
    ...outlierLines(timings)
      .map((line) => {
        return `  ${line}`;
      }),
  ].join('\n'));
};
