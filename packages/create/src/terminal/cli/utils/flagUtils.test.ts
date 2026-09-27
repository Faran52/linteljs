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
  // The recorded answers are read off the machine or hand-edited, so none of them is a flag.
  it('carries every answer with a flag, under its own key, and none without', () => {
    const typeSafetyFlag = FLAGGED.find(({ key }) => {
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

    expect(options['libraries']).toEqual({
      type: 'string',
      multiple: true,
    });
    expect(options['target']).toEqual({ type: 'string' });
  });
});

describe('widthOf', () => {
  it('answers the length of the widest name', () => {
    expect(widthOf(['lint', 'standard', 'fix'])).toBe(8);
  });
});

describe('answerUsage', () => {
  // Built from the records, so each line is held to its record rather than to a copy of the text.
  it('shapes each answer line from its record: list or value, every choice, and any note', () => {
    expect(lineFor('libraries')).toMatch(/^ {2}--libraries <list> /u);
    expect(lineFor('target')).toMatch(/^ {2}--target <value> /u);
    expect(lineFor('target').endsWith(valuesOf(ANSWERS.target.values).join(', '))).toBe(true);
    expect(lineFor('router').endsWith(` (${ANSWERS.router.note})`)).toBe(true);
  });

  // `form` carries no `slot`: every target asks it. Only `react-hook-form`, one of its two values, is react-only.
  it('does not scope --form to react, since only one of its values is', () => {
    expect(lineFor('form')).toContain('react-hook-form');
    expect(lineFor('form')).not.toContain('react only');
  });

  it('lines up every answer description on one column, store included', () => {
    expect(lineFor('store').indexOf('zustand')).toBe(lineFor('type-safety').indexOf('strict'));
  });
});
