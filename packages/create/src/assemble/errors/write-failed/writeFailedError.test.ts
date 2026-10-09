import { expect, it } from 'vitest';

import { WriteFailed } from './writeFailedError';

it('is an Error carrying its message', () => {
  const failed = new WriteFailed('no');

  expect(failed).toBeInstanceOf(Error);
  expect(failed.message).toBe('no');
});
