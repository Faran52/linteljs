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

// `recorded/` answers are hand-edited or read off the machine, never passed on the command line.
const isFlaggable = (record: AnswerRecord): record is FlaggedRecord => {
  return record.flag !== undefined;
};

export const flaggedAnswers = (): FlaggedAnswer[] => {
  return valuesOf(ANSWERS)
    .flatMap((key): FlaggedAnswer[] => {
      const record: AnswerRecord = ANSWERS[key];

      const entries: FlaggedAnswer[] = isFlaggable(record)
        ? [{
            key,
            record,
            flag: record.flag,
          }]
        : [];

      return entries;
    });
};

const isMultiKind = (record: AnswerRecord): boolean => {
  return record.kind === 'multi' || record.kind === 'optionalMulti';
};

export const answerOptions = (flagged: readonly FlaggedAnswer[]): Record<string, AnswerOption> => {
  const options = flagged
    .map(({ flag, record }): [string, AnswerOption] => {
      const option: [string, AnswerOption] = [flag, {
        type: 'string',
        ...(isMultiKind(record) ? { multiple: true } : {}),
      }];

      return option;
    });

  return Object.fromEntries(options);
};

const labelOf = ({ flag, record }: FlaggedAnswer): string => {
  const shape = isMultiKind(record) ? 'list' : 'value';

  return `--${flag} <${shape}>`;
};

const noteOf = (record: AnswerRecord): string => {
  return record.note === undefined ? '' : ` (${record.note})`;
};

export const widthOf = (names: readonly string[]): number => {
  return Math.max(...names
    .map((name) => {
      return name.length;
    }));
};

export const answerUsage = (flagged: readonly FlaggedAnswer[]): string => {
  const width = widthOf(flagged.map(labelOf));

  return flagged
    .map((answer) => {
      return `  ${labelOf(answer).padEnd(width)}  ${valuesOf(answer.record.values).join(', ')}${noteOf(answer.record)}`;
    })
    .join('\n');
};
