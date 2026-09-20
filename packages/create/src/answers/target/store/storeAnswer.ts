import type { AnswerRecord } from '../../types';

// Asked as a radio between `none` and the target's own `StoreSlot`, which is why it carries no `values`: the prompt
// reads the label and hint off `TargetRecord.store` itself.
export const storeAnswer = {
  key: 'store',
  flag: 'store',
  prompt: 'State store',
  slot: (target) => {
    return target.store !== undefined;
  },
  kind: 'boolean',
} as const satisfies AnswerRecord;
