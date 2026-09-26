import { valuesOf } from '@utils/objectUtils';

import {
  type AnswerKey,
  type AnswerRecord,
  ANSWERS,
  type ListRecord,
  type MapRecord,
  type TextRecord,
} from '@answers';

type FlaggableRecord = Exclude<AnswerRecord, ListRecord | MapRecord | TextRecord>;

interface FlagField {
  flag: string;
}

type FlaggedRecord = FlaggableRecord & FlagField;

export interface FlaggedAnswer {
  key: AnswerKey;
  record: FlaggableRecord;
  flag: string;
}

interface AnswerOption {
  type: 'string';
  multiple?: true;
}

// Nothing under `recorded/` carries a `flag`: `resolveConditions`, `aliases` and `ignores` are hand-edited, and the
// manager and the two versions are read off the machine that ran this, never passed on the command line.
const isFlaggable = (record: AnswerRecord): record is FlaggedRecord => {
  return record.flag !== undefined;
};

// Every record with a `flag`, in `ANSWERS`' own order, each already carrying the key that named it.
export const flaggedAnswers = (): FlaggedAnswer[] => {
  return valuesOf(ANSWERS).flatMap((key): FlaggedAnswer[] => {
    const record: AnswerRecord = ANSWERS[key];

    return isFlaggable(record)
      ? [{
          key,
          record,
          flag: record.flag,
        }]
      : [];
  });
};

const isMultiKind = (record: AnswerRecord): boolean => {
  return record.kind === 'multi' || record.kind === 'optionalMulti';
};

// `string`, `multiple` for the two kinds that ask for a list, `string` alone otherwise.
export const answerOptions = (flagged: readonly FlaggedAnswer[]): Record<string, AnswerOption> => {
  return Object.fromEntries(flagged.map(({ flag, record }): [string, AnswerOption] => {
    return [flag, {
      type: 'string',
      ...(isMultiKind(record) ? { multiple: true } : {}),
    }];
  }));
};

const labelOf = ({ flag, record }: FlaggedAnswer): string => {
  const shape = isMultiKind(record) ? 'list' : 'value';

  return `--${flag} <${shape}>`;
};

const noteOf = (record: AnswerRecord): string => {
  return record.note === undefined ? '' : ` (${record.note})`;
};

// The widest of a set of names, so every line pads to one column rather than each carrying its own gap.
export const widthOf = (names: readonly string[]): number => {
  return Math.max(...names.map((name) => {
    return name.length;
  }));
};

// One usage line per answer, built from its record: list or value, every choice, and any note.
export const answerUsage = (flagged: readonly FlaggedAnswer[]): string => {
  const width = widthOf(flagged.map(labelOf));

  return flagged.map((answer) => {
    return `  ${labelOf(answer).padEnd(width)}  ${valuesOf(answer.record.values).join(', ')}${noteOf(answer.record)}`;
  }).join('\n');
};
