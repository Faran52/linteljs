import {
  describe,
  expect,
  it,
} from 'vitest';

import { applied, refusal } from './editUtils';
import { parse } from './sourceUtils';

describe('applied', () => {
  it('applies every edit against the text as it was written', () => {
    const text = applied('abcdef', [
      {
        start: 0,
        end: 1,
        insert: 'xx',
      },
      {
        start: 4,
        end: 6,
        insert: 'y',
      },
    ]);

    expect(text).toBe('xxbcdy');
  });

  it('applies edits that only meet, and an insert where another edit ends', () => {
    const text = applied('abcdef', [
      {
        start: 0,
        end: 2,
        insert: 'x',
      },
      {
        start: 2,
        end: 4,
        insert: 'y',
      },
      {
        start: 4,
        end: 4,
        insert: 'z',
      },
    ]);

    expect(text).toBe('xyzef');
  });

  it.each([
    [1, 3],
    [2, 2],
    [0, 6],
  ])('refuses an edit from %i to %i over another from 1 to 4', (start, end) => {
    const run = (): string => {
      return applied('abcdef', [
        {
          start: 1,
          end: 4,
          insert: 'x',
        },
        {
          start,
          end,
          insert: 'y',
        },
      ]);
    };

    expect(run).toThrow('Two edits of one text overlap, so neither can be written as it was meant');
  });
});

describe('refusal', () => {
  it('shows the start of the code it is about', () => {
    const long = `call(${'a'.repeat(100)});`;
    const [statement] = parse(long).statements;
    const { message } = refusal(statement ?? parse(''), 'Not allowed');

    expect(message).toBe(`Not allowed: call(${'a'.repeat(75)}`);
  });
});
