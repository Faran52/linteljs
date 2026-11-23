import { upperFirst } from 'es-toolkit';

import { RUN_PREFIX } from '@config/constants';

import { localesOf } from '@utils/answerUtils';
import { keysOf } from '@utils/objectUtils';

import {
  type AnswerKey,
  type AnswerRecord,
  promptOf,
} from '@answers';
import { targetFor } from '@targets';

import { FRAMEWORK_PACKAGES, MAX_LINE } from '../../../constants';
import { buildScripts, gateScripts } from '../../utils/scriptUtils';

import type {
  Answers,
  Framework,
  HostedAnswers,
} from '@config/types';

type StackFacts = Pick<Answers, 'packageManager' | 'packageManagerVersion' | 'nodeVersion'>;

type AnswerValue = Answers[AnswerKey];

type AnswerEntry = [key: AnswerKey, prompt: string | undefined, value: AnswerValue];

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
  const rows = gateRowsOf(RUN_PREFIX[answers.packageManager], buildScripts(answers), gateScripts(answers));

  return rows;
};

// In `check`'s order, skipping a gate the scripts lack.
export const gateRowsOf = (
  run: string,
  scripts: Record<string, string>,
  gates: readonly string[],
): [string, string][] => {
  return gates
    .flatMap((name) => {
      const runs = scripts[name];
      const rows: [string, string][] = runs === undefined
        ? []
        : [[`command: '${run} ${name}'`, `runs: ${literal(runs)}`]];

      return rows;
    });
};

// The page states what was recorded, not a range to resolve.
const plain = (range: string | undefined): string | undefined => {
  return range?.replace(/^[\^~]/, '');
};

// A row whose version is unknown is left out rather than printed empty.
export const stackRows = (answers: HostedAnswers, versions: Record<string, string>): [string, string][] => {
  return stackRowsOf(targetFor(answers).framework, answers, versions);
};

const stackRowsOf = (
  framework: Framework | undefined,
  facts: StackFacts,
  versions: Record<string, string>,
): [string, string][] => {
  const frameworkRows: [string, string | undefined][] = framework === undefined
    ? []
    : [[framework, plain(versions[FRAMEWORK_PACKAGES[framework] ?? framework])]];
  const rows: [string, string | undefined][] = [
    ['linteljs', plain(versions['@linteljs/eslint-config'])],
    ...frameworkRows,
    ['typescript', plain(versions['typescript'])],
    ['node', facts.nodeVersion],
    [facts.packageManager, facts.packageManagerVersion],
  ];

  return rows
    .flatMap(([name, version]) => {
      const entryRows: [string, string][] = version === undefined ? [] : [[`name: '${name}'`, `version: '${version}'`]];

      return entryRows;
    });
};

// Narrowed here, so a record that gains a `prompt` prints nothing rather than `[object Object]`.
const printable = (value: AnswerValue): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? undefined : value.join(', ');
  }

  return undefined;
};

// An i18n project's page translates the label, so it gets the locale key the shared locales hold for it.
const answerLabelKey = (key: AnswerKey): string => {
  return `answer${upperFirst(key)}`;
};

// An answer the target never asks still holds its default, so it is left out with the prompts that skip it.
export const answerRows = (answers: Answers, records: Record<AnswerKey, AnswerRecord>): [string, string][] => {
  const target = targetFor(answers);
  const entries = keysOf(records)
    .map((key) => {
      const record = records[key];
      const prompt = record.slot?.(target) === false ? undefined : promptOf(record, target);
      const entry: AnswerEntry = [
        key,
        prompt,
        answers[key],
      ];

      return entry;
    });

  return answerRowsOf(entries, localesOf(answers).length > 0);
};

// An entry with no prompt is one its target does not ask.
const answerRowsOf = (entries: readonly AnswerEntry[], translated: boolean): [string, string][] => {
  return entries
    .flatMap(([
      key,
      prompt,
      value,
    ]) => {
      const printed = printable(value);

      if (prompt === undefined || printed === undefined) {
        return [];
      }

      const label = translated ? answerLabelKey(key) : prompt;
      const entryRows: [string, string][] = [[`label: '${label}'`, `value: '${printed}'`]];

      return entryRows;
    });
};
