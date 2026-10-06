import {
  describe,
  expect,
  it,
} from 'vitest';

import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import { USAGE_HEAD, USAGE_TAIL } from '../constants';

import {
  answerOptions,
  answerUsage,
  flaggedAnswers,
  usage,
  widthOf,
} from './flagUtils';

const lineFor = (flag: string): string => {
  const flagged = flaggedAnswers();

  return answerUsage(flagged)
    .split('\n')
    .find((line) => {
      return line.startsWith(`  --${flag} `);
    }) ?? '';
};

describe('flaggedAnswers', () => {
  it('carries every answer with a flag, under its own key, and none without', () => {
    const flagged = flaggedAnswers();
    const typeSafetyFlag = flagged
      .find(({ key }) => {
        return key === 'typeSafety';
      })?.flag;

    expect(typeSafetyFlag).toBe('type-safety');

    const keys = flagged
      .map(({ key }) => {
        return key;
      });

    expect(keys).not.toContain('nodeVersion');
  });
});

describe('answerOptions', () => {
  it('declares a list answer repeatable and a single one not', () => {
    const flagged = flaggedAnswers();
    const options = answerOptions(flagged);

    const librariesFlag = {
      type: 'string',
      multiple: true,
    };
    expect(options['libraries']).toEqual(librariesFlag);

    const targetFlag = { type: 'string' };
    expect(options['target']).toEqual(targetFlag);
  });
});

describe('widthOf', () => {
  it('answers the length of the widest name', () => {
    const width = widthOf([
      'lint',
      'standard',
      'fix',
    ]);
    expect(width).toBe(8);
  });
});

describe('answerUsage', () => {
  it('shapes each answer line from its record: list or value, every choice, and any note', () => {
    const line = lineFor('libraries');
    expect(line).toMatch(/^ {2}--libraries <list> /u);
    const targetLine = lineFor('target');
    expect(targetLine).toMatch(/^ {2}--target <value> /u);
    const listsTargets = lineFor('target').endsWith(keysOf(ANSWERS.target.values).join(', '));
    expect(listsTargets).toBe(true);
    const notesRouter = lineFor('router').endsWith(` (${ANSWERS.router.note})`);
    expect(notesRouter).toBe(true);
  });

  it.each([
    'styling',
    'form',
    'data',
    'mocking',
  ])('notes that --%s is not offered on the typescript target', (flag) => {
    const line = lineFor(flag);
    expect(line).toMatch(/ \(not on typescript\)$/u);
  });

  it('does not scope --form to react, since only one of its values is', () => {
    const line = lineFor('form');
    expect(line).toContain('react-hook-form');
    const formLine = lineFor('form');
    expect(formLine).not.toContain('react only');
  });

  it('lines up every answer description on one column, store included', () => {
    const index = lineFor('store').indexOf('zustand');
    expect(index).toBe(lineFor('type-safety').indexOf('strict'));
  });
});

describe('usage', () => {
  it('puts the answer lines between the fixed head and tail', () => {
    const flagged = flaggedAnswers();
    const lines = answerUsage(flagged);
    const expected = `${USAGE_HEAD}${lines}${USAGE_TAIL}`;
    const text = usage();
    expect(text).toBe(expected);
  });

  it('ends on the sync note, naming sync under every manager', () => {
    const text = usage();
    const endsOnSync = text.endsWith('Without a terminal a step needs --yes.\n'
      + 'Run it through the project\'s manager, which npx is only in an npm project:\n'
      + 'pnpm dlx, npx, yarn dlx or bunx @linteljs/create sync.\n');
    expect(endsOnSync).toBe(true);
  });
});
