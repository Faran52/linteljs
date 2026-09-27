import type { Linter } from 'eslint';
import type { SkipReason } from '../utils/corpusUtils.ts';
import type { OptionValue } from '../utils/optionUtils.ts';
import type { Finding } from './utils/reportShapeUtils.ts';
import type { Timing } from './utils/timingUtils.ts';

export type Flavour = 'js' | 'ts';

export interface Located extends Finding {
  file: string;
  flavour: Flavour;
}

export type Counts = Record<'changed'
  | 'duplicate'
  | 'scanned'
  | 'unparsed'
  | SkipReason, number>;

// One run's state, passed rather than held at module level so each mode reads what it was handed.
export interface AuditContext {
  activeRules: string[];
  auditCounts: Map<string, number>;
  auditVolume: [number, string][];
  configCache: Map<string, Linter.Config[]>;
  counts: Record<Flavour, Counts>;
  files: string[];
  findings: Located[];
  // The first `fix` of the current file, which is the whole-plugin pass a consumer pays for. Later calls attribute.
  fixTimes: number[];
  linter: Linter;
  // The options every config carries, by rule id. The sweep sets them per configuration and clears them after.
  options: Record<string, Record<string, OptionValue>>;
  seen: Set<string>;
  sources: string[];
  timings: Timing[];
}
