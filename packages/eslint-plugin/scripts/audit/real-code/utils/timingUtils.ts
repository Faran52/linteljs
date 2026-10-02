import { orderBy, sum } from 'es-toolkit';

import { log, logWarn } from '../../../../../create/templates/project/scripts/utils/loggerUtils.ts';
import {
  BUCKET_WIDTH,
  BYTES_PER_KIB,
  MEDIAN,
  MS_PER_SECOND,
  NS_PER_MS,
  P99,
  SAMPLE_WIDTH,
  SHOWN_SAMPLES,
  SIZE_BUCKETS,
} from '../constants.ts';

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

const OUTLIER_FACTOR = 25;

const SUPERLINEAR_MIN_FILES = 20;
const SUPERLINEAR_RATIO = 3;

// Nearest-rank, so the answer is a time some file took.
const quantile = (sorted: number[], fraction: number): number => {
  const rank = Math.floor(sorted.length * fraction);
  const index = Math.min(sorted.length - 1, rank);

  return sorted[index] ?? 0;
};

const medianOf = (values: number[]): number => {
  const ascending = [...values]
    .sort((left, right) => {
      return left - right;
    });

  return quantile(ascending, MEDIAN);
};

const nanosPerByte = (sample: Timing): number => {
  return (sample.ms * NS_PER_MS) / sample.bytes;
};

const kib = (bytes: number): string => {
  return `${(bytes / BYTES_PER_KIB).toFixed(1)} KiB`;
};

const bucketRows = (timings: Timing[]): BucketRow[] => {
  return SIZE_BUCKETS
    .flatMap(([label, limit], index) => {
      const floor = SIZE_BUCKETS[index - 1]?.[1] ?? 0;
      const inBucket = timings
        .filter((sample) => {
          return sample.bytes >= floor && sample.bytes < limit;
        });

      if (inBucket.length === 0) {
        return [];
      }

      const durations = inBucket
        .map((sample) => {
          return sample.ms;
        });
      const costs = inBucket.map(nanosPerByte);
      const rows: BucketRow[] = [{
        files: inBucket.length,
        label,
        medianMs: medianOf(durations),
        nsPerByte: medianOf(costs),
      }];

      return rows;
    });
};

// Time per byte climbing with size is what a quadratic rule looks like from outside.
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

// A slow file is not a broken fix, so outliers never fail the run.
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
  const lines = [
    `${String(outliers.length)} timing outlier(s): over ${String(OUTLIER_FACTOR)}x the median `
    + `${median.toFixed(0)} ns/byte, among files over ${String(OUTLIER_FLOOR_BYTES)} bytes and `
    + `${String(OUTLIER_FLOOR_MS)}ms`,
    ...outliers
      .slice(0, SHOWN_SAMPLES)
      .map((sample) => {
        return `  ! ${sample.ms.toFixed(1)}ms ${kib(sample.bytes)} `
          + `${nanosPerByte(sample).toFixed(0)} ns/byte  ${sample.file}`;
      }),
  ];

  return lines;
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
  const lintSeconds = sum(sortedMs) / MS_PER_SECOND;
  const rows = bucketRows(timings);
  const slowest = orderBy(timings, ['ms'], ['desc']).slice(0, SHOWN_SAMPLES);

  const report = [
    'timing: one whole-plugin --fix pass per linted file, the audit pass excluded',
    `  ${String(timings.length)} files in ${lintSeconds.toFixed(1)}s of fix time, `
    + `${(timings.length / lintSeconds).toFixed(1)} files/s (${(wallMs / MS_PER_SECOND).toFixed(1)}s wall, `
    + 'the rest is reading, parsing and the audit)',
    `  per file: median ${quantile(sortedMs, MEDIAN).toFixed(2)}ms, p99 ${quantile(sortedMs, P99).toFixed(2)}ms, `
    + `slowest ${(sortedMs.at(-1) ?? 0).toFixed(2)}ms`,
    '  time per byte by size:',
    `    ${'size'.padEnd(BUCKET_WIDTH.size)}${'files'.padStart(BUCKET_WIDTH.files)}`
    + `${'median ms'.padStart(BUCKET_WIDTH.medianMs)}${'ns/byte'.padStart(BUCKET_WIDTH.nsPerByte)}`,
    ...rows
      .map((row) => {
        return `    ${row.label.padEnd(BUCKET_WIDTH.size)}${String(row.files).padStart(BUCKET_WIDTH.files)}`
          + `${row.medianMs
            .toFixed(2)
            .padStart(BUCKET_WIDTH.medianMs)}${row.nsPerByte
            .toFixed(0)
            .padStart(BUCKET_WIDTH.nsPerByte)}`;
      }),
    `  ${superlinearVerdict(rows)}`,
    `  slowest ${String(SHOWN_SAMPLES)}, with the rule that dominates each:`,
    ...slowest
      .flatMap((sample) => {
        const dominant = dominantRule(sample.file);
        const sampleLines = [
          `    ${sample.ms
            .toFixed(1)
            .padStart(SAMPLE_WIDTH.ms)}ms ${kib(sample.bytes).padStart(SAMPLE_WIDTH.kib)} `
            + `${nanosPerByte(sample)
              .toFixed(0)
              .padStart(SAMPLE_WIDTH.nsPerByte)} ns/byte  ${dominant.rule} `
              + `${dominant.ms.toFixed(1)}ms over a ${dominant.baseline.toFixed(1)}ms parse`,
          `      ${sample.file}`,
        ];

        return sampleLines;
      }),
    ...outlierLines(timings)
      .map((line) => {
        return `  ${line}`;
      }),
  ].join('\n');

  log(report);
};
