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
});

describe('refusal', () => {
  it('shows the start of the code it is about', () => {
    const long = `call(${'a'.repeat(100)});`;
    const [statement] = parse(long).statements;
    const { message } = refusal(statement ?? parse(''), 'Not allowed');

    expect(message).toBe(`Not allowed: call(${'a'.repeat(75)}`);
  });
});
