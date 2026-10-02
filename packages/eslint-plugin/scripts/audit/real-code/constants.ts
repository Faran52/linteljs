export const MS_PER_SECOND = 1000;

export const NS_PER_MS = 1e6;

export const BYTES_PER_KIB = 1024;

export const MEDIAN = 0.5;

export const P99 = 0.99;

// The outliers and the slowest files listed.
export const SHOWN_SAMPLES = 20;

export const BUSIEST_FILES_SHOWN = 5;

export const SNIPPET_LINES_SHOWN = 40;

// Lines shown either side of a finding's line.
export const SNIPPET_CONTEXT_LINES = 2;

// How often a long pass reports progress, in files.
export const FIX_PROGRESS_EVERY = 500;

export const SWEEP_PROGRESS_EVERY = 250;

export const COUNT_WIDTH = 7;

export const SWEEP_WIDTH = {
  scanned: 6,
  changed: 6,
  findings: 4,
};

export const BUCKET_WIDTH = {
  size: 14,
  files: 7,
  medianMs: 12,
  nsPerByte: 10,
};

export const SAMPLE_WIDTH = {
  ms: 8,
  kib: 11,
  nsPerByte: 6,
};

export const SIZE_BUCKETS: [string, number][] = [
  ['under 1 KiB', 1024],
  ['1 to 4 KiB', 4096],
  ['4 to 16 KiB', 16_384],
  ['16 to 64 KiB', 65_536],
  ['64 to 256 KiB', 262_144],
  ['over 256 KiB', Infinity],
];

// Lines of context tried around a finding, smallest first, until it reproduces alone.
export const REPRODUCTION_PADS = [
  0,
  1,
  2,
  4,
  8,
  16,
  32,
];

// Git's own hunk context.
export const HUNK_CONTEXT_LINES = 3;
