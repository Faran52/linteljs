import type { Answers } from '@config/types';
import type { TargetRecord } from '@targets';

export interface ValueRecord {
  label: string;
  hint?: string;
  // One value's legality can depend on another answer: `rtk-query` needs its store.
  only?: (target: TargetRecord, answered: Answers) => boolean;
}

interface Base {
  key: string;
  flag?: string;
  // Absent means never asked.
  prompt?: string;
  // In `--help` after the choices: 'react only', 'webextension only'.
  note?: string;
  description?: string;
  // Absent means every target.
  slot?: (target: TargetRecord) => boolean;
  askedWhen?: (answered: Answers) => boolean;
}

export interface ChoiceRecord<V extends string = string> extends Base {
  kind: 'choice';
  values: Record<V, ValueRecord>;
  default: V;
}

export interface OptionalChoiceRecord<V extends string = string> extends Base {
  kind: 'optionalChoice';
  values: Record<V, ValueRecord>;
  // `only` would have nothing to narrow: this value is not in `values`.
  none: Omit<ValueRecord, 'only'>;
}

export interface MultiRecord<V extends string = string> extends Base {
  kind: 'multi';
  values: Record<V, Omit<ValueRecord, 'only'>>;
  default: V[];
  // The schema records `default`; a target may preselect fewer.
  targetDefault?: (target: TargetRecord) => V[] | undefined;
  minimum?: number;
}

export interface OptionalMultiRecord<V extends string = string> extends Base {
  kind: 'optionalMulti';
  values: Record<V, Omit<ValueRecord, 'only'>>;
  // The prompt takes no pick, which records nothing.
  skippable?: true;
  minimum?: number;
}

export interface ListRecord extends Base {
  kind: 'list';
}

export interface MapRecord extends Base {
  kind: 'map';
}

export interface TextRecord extends Base {
  kind: 'text';
  pattern: string;
}

export type AnswerRecord
  = ChoiceRecord
    | ListRecord
    | MapRecord
    | MultiRecord
    | OptionalChoiceRecord
    | OptionalMultiRecord
    | TextRecord;
