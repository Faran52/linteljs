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

export interface AuditContext {
  activeRules: string[];
  auditCounts: Map<string, number>;
  auditVolume: [number, string][];
  configCache: Map<string, Linter.Config[]>;
  counts: Record<Flavour, Counts>;
  files: string[];
  findings: Located[];
  // The first `fix` is the whole-plugin pass a consumer pays for; later calls attribute.
  fixTimes: number[];
  linter: Linter;
  options: Record<string, Record<string, OptionValue>>;
  seen: Set<string>;
  sources: string[];
  timings: Timing[];
}
