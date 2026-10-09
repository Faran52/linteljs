import { expect, it } from 'vitest';

import { Refused } from './refusedError';

it('is an Error carrying its message', () => {
  const refused = new Refused('no');

  expect(refused).toBeInstanceOf(Error);
  expect(refused.message).toBe('no');
});
