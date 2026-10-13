import {
  describe,
  expect,
  it,
} from 'vitest';

import { STATUSES } from '@config/statuses';

import { ForbiddenError, knownStatus } from './statusUtils';

describe('ForbiddenError', () => {
  it('is an error a boundary can tell apart by its class and its name', () => {
    const error = new ForbiddenError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ForbiddenError');
    expect(error.message).toBe('Forbidden');
  });
});

describe('knownStatus', () => {
  it('answers the page for a forbidden or missing route', () => {
    const forbidden = knownStatus(403);
    const notFound = knownStatus(404);

    expect(forbidden).toBe(STATUSES.forbidden);
    expect(notFound).toBe(STATUSES.notFound);
  });

  it('answers nothing for any other status, which the caller shows as a crash', () => {
    const serverError = knownStatus(500);
    const teapot = knownStatus(418);

    expect(serverError).toBeUndefined();
    expect(teapot).toBeUndefined();
  });
});
