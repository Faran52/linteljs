import { valuesOf } from '@utils/objectUtils';

import { type AnswerKey, type AnswerRecord } from '@answers';
import { targetFor } from '@targets';

import type { Answers, HostedAnswers } from '@config/types';

// A version range as written, with the caret stripped: the page states what was recorded, not a range to resolve.
const plain = (range: string | undefined): string | undefined => {
  return range?.replace(/^[\^~]/, '');
};

// The stack, in the order a reader cares about it: this CLI, the framework it wrote for, the build tool, then the
// machine. A row whose version is unknown is left out rather than printed empty.
export const stackRows = (answers: HostedAnswers, versions: Record<string, string>): [string, string][] => {
  const target = targetFor(answers);
  const framework: [string, string | undefined][] = target.framework === undefined
    ? []
    : [[target.framework, plain(versions[target.framework])]];
  const rows: [string, string | undefined][] = [
    ['linteljs', plain(versions['@linteljs/eslint-config'])],
    ...framework,
    ['typescript', plain(versions['typescript'])],
    ['node', answers.nodeVersion],
    [answers.packageManager, answers.packageManagerVersion],
  ];

  return rows
    .flatMap(([name, version]) => {
      return version === undefined ? [] : [[`name: '${name}'`, `version: '${version}'`] satisfies [string, string]];
    });
};

/**
 * Only what a prompt asked and an answer holds: a never-asked record and an absent optional both print nothing.
 *
 * A word or a list of them is the whole vocabulary a page can render. `aliases` is a map and `ignores` a path list,
 * and neither carries a `prompt`, but the narrowing is here rather than implied by that: a record that gains one
 * should print nothing rather than `[object Object]`.
 */
const printable = (value: Answers[AnswerKey]): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  // The only array an answer holds is a list of strings; a map and an absent answer both print nothing.
  if (Array.isArray(value)) {
    return value.length === 0 ? undefined : value.join(', ');
  }

  return undefined;
};

export const answerRows = (answers: Answers, records: Record<AnswerKey, AnswerRecord>): [string, string][] => {
  return valuesOf(records)
    .flatMap((key: AnswerKey) => {
      const record = records[key];
      const printed = printable(answers[key]);

      return record.prompt === undefined || printed === undefined
        ? []
        : [[`label: '${record.prompt}'`, `value: '${printed}'`] satisfies [string, string]];
    });
};
