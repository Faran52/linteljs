import type { Answers } from '@config/types';
import type { TargetRecord } from '@targets';

// Display only: the persisted value is never the label or the hint.
export interface ValueRecord {
  label: string;
  hint?: string;
  /**
   * Narrows the offered values within a legal slot; absent means every value in `values` is legal.
   *
   * The answers so far are the second argument because one value is legal or not by another answer rather than by
   * the target: `rtk-query` ships inside `@reduxjs/toolkit` and needs that store. A predicate rather than a second
   * mechanism, so the prompt hides what the parser refuses and the rule is written once.
   */
  only?: (target: TargetRecord, answered: Answers) => boolean;
}

interface Base {
  key: string;
  // `--target`, `--type-safety`; absent with `prompt` on a never-asked answer.
  flag?: string;
  // 'Package manager'; absent means never asked and no flag.
  prompt?: string;
  // In `--help` after the choices: 'react only', 'webextension only'.
  note?: string;
  // In the published schema.
  description?: string;
  // Asked and accepted only where this holds; absent means every target.
  slot?: (target: TargetRecord) => boolean;
  // Prompt only: plugins after a non-empty agents.
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
  // A label and a hint only: `only` would have nothing to narrow, since this value is not in `values`.
  none: Omit<ValueRecord, 'only'>;
}

export interface MultiRecord<V extends string = string> extends Base {
  kind: 'multi';
  values: Record<V, ValueRecord>;
  default: V[];
  minimum?: number;
}

export interface OptionalMultiRecord<V extends string = string> extends Base {
  kind: 'optionalMulti';
  values: Record<V, ValueRecord>;
  minimum?: number;
}

// Open strings: `minItems` is 1, always, and there is nothing to enumerate.
export interface ListRecord extends Base {
  kind: 'list';
}

// `aliases`: `^[@$]` keys, non-empty string values.
export interface MapRecord extends Base {
  kind: 'map';
}

// One string, its shape its whole vocabulary: the two recorded versions, neither asked nor flagged.
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
