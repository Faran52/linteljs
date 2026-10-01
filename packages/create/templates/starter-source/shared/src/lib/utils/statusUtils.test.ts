import { ForbiddenError } from '@utils/statusUtils';
import {
  describe,
  expect,
  it,
} from 'vitest';

describe('ForbiddenError', () => {
  it('is an error a boundary can tell apart by its class and its name', () => {
    const error = new ForbiddenError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ForbiddenError');
    expect(error.message).toBe('Forbidden');
  });
});
