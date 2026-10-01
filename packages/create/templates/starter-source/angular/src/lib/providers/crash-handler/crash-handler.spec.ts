import { TestBed } from '@angular/core/testing';

import { ForbiddenError } from '@utils/status-utils';

import { CrashHandler } from './crash-handler';

describe('CrashHandler', () => {
  it('reports what it caught and names a crash', () => {
    const logged = vi.spyOn(console, 'error')
      .mockReturnValue(undefined);
    const handler = TestBed.inject(CrashHandler);
    const error = new Error('render failed');

    handler.handleError(error);

    expect(logged).toHaveBeenCalledWith(error);
    expect(handler.crash()).toBe('serverError');
  });

  it('names a ForbiddenError apart from a crash', () => {
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);

    const handler = TestBed.inject(CrashHandler);

    handler.handleError(new ForbiddenError());

    expect(handler.crash()).toBe('forbidden');
  });
});
