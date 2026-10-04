import { RUN_PREFIX } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import { type AnswerKey, type AnswerRecord } from '@answers';
import { targetFor } from '@targets';

import { MAX_LINE } from '../../../constants';
import { buildScripts, gateScripts } from '../../utils/scriptUtils';

import type { Answers, HostedAnswers } from '@config/types';

// A long command breaks at its spaces into joined literals, inside the base layer's 120 columns.
const RUNS_WIDTH = 100;

export const literal = (command: string): string => {
  const lines = command
    .split(' ')
    .reduce<string[]>((joined, word) => {
      const last = joined.at(-1);

      const withWord = last === undefined || last.length + word.length >= RUNS_WIDTH
        ? [...joined, word]
        : [...joined.slice(0, -1), `${last} ${word}`];

      return withWord;
    }, []);

  return lines
    .map((line, index) => {
      return index === lines.length - 1 ? `'${line}'` : `'${line} '`;
    })
    .join('\n      + ');
};

// The widest piece line, `    + '` and `';` around it, stays inside the 120 columns.
const NAME_PIECE = /.{1,110}/g;

export const nameDeclaration = (name: string): string => {
  const line = `export const NAME = '${name}';`;

  if (line.length <= MAX_LINE) {
    return line;
  }

  const pieces = name.matchAll(NAME_PIECE);
  const quoted = Array
    .from(pieces, ([piece]) => {
      return `'${piece}'`;
    })
    .join('\n    + ');

  return `export const NAME\n  = ${quoted};`;
};

// Read off the scripts `package.json` gets, so the page cannot name a command the project does not run.
export const gateRows = (answers: Answers): [string, string][] => {
  const run = RUN_PREFIX[answers.packageManager];
  const gates = gateScripts(answers);
  const scripts = buildScripts(answers);

  return Object.entries(scripts)
    .filter(([name]) => {
      return gates.includes(name);
    })
    .map(([name, runs]) => {
      const row: [string, string] = [`command: '${run} ${name}'`, `runs: ${literal(runs)}`];

      return row;
    });
};

// The page states what was recorded, not a range to resolve.
const plain = (range: string | undefined): string | undefined => {
  return range?.replace(/^[\^~]/, '');
};

// A row whose version is unknown is left out rather than printed empty.
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
      const entryRows: [string, string][] = version === undefined ? [] : [[`name: '${name}'`, `version: '${version}'`]];

      return entryRows;
    });
};

// Narrowed here, so a record that gains a `prompt` prints nothing rather than `[object Object]`.
const printable = (value: Answers[AnswerKey]): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? undefined : value.join(', ');
  }

  return undefined;
};

// An answer the target never asks still holds its default, so it is left out with the prompts that skip it.
export const answerRows = (answers: Answers, records: Record<AnswerKey, AnswerRecord>): [string, string][] => {
  const target = targetFor(answers);

  return valuesOf(records)
    .flatMap((key: AnswerKey) => {
      const record = records[key];
      const printed = printable(answers[key]);
      const unasked = record.slot?.(target) === false;

      const entryRows: [string, string][] = record.prompt === undefined || printed === undefined || unasked
        ? []
        : [[`label: '${record.prompt}'`, `value: '${printed}'`]];

      return entryRows;
    });
};
