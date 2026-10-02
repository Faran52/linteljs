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

    const crash = handler.crash();

    expect(logged).toHaveBeenCalledWith(error);
    expect(crash).toBe('serverError');
  });

  it('names a ForbiddenError apart from a crash', () => {
    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);

    const handler = TestBed.inject(CrashHandler);

    handler.handleError(new ForbiddenError());

    const crash = handler.crash();

    expect(crash).toBe('forbidden');
  });
});
