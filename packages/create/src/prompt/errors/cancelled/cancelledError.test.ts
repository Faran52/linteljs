import { expect, it } from 'vitest';

import { Cancelled } from './cancelledError';

it('is an Error carrying its message', () => {
  const cancelled = new Cancelled('no');

  expect(cancelled).toBeInstanceOf(Error);
  expect(cancelled.message).toBe('no');
});
