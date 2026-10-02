import {
  describe,
  expect,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import {
  answerOptions,
  answerUsage,
  flaggedAnswers,
  widthOf,
} from './flagUtils';

const FLAGGED = flaggedAnswers();

const lineFor = (flag: string): string => {
  return answerUsage(FLAGGED)
    .split('\n')
    .find((line) => {
      return line.startsWith(`  --${flag} `);
    }) ?? '';
};

describe('flaggedAnswers', () => {
  it('carries every answer with a flag, under its own key, and none without', () => {
    const typeSafetyFlag = FLAGGED
      .find(({ key }) => {
        return key === 'typeSafety';
      })?.flag;

    expect(typeSafetyFlag).toBe('type-safety');

    const keys = FLAGGED
      .map(({ key }) => {
        return key;
      });

    expect(keys).not.toContain('nodeVersion');
  });
});

describe('answerOptions', () => {
  it('declares a list answer repeatable and a single one not', () => {
    const options = answerOptions(FLAGGED);

    const expected = {
      type: 'string',
      multiple: true,
    };
    expect(options['libraries']).toEqual(expected);

    const expected2 = { type: 'string' };
    expect(options['target']).toEqual(expected2);
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
    const actual = lineFor('target').endsWith(valuesOf(ANSWERS.target.values).join(', '));
    expect(actual).toBe(true);
    const actual2 = lineFor('router').endsWith(` (${ANSWERS.router.note})`);
    expect(actual2).toBe(true);
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
