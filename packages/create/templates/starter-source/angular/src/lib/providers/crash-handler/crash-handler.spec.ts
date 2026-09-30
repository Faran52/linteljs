import { TestBed } from '@angular/core/testing';

import { CrashHandler } from './crash-handler';

describe('CrashHandler', () => {
  it('reports what it caught and raises the flag', () => {
    const logged = vi.spyOn(console, 'error')
      .mockReturnValue(undefined);
    const handler = TestBed.inject(CrashHandler);
    const error = new Error('render failed');

    handler.handleError(error);

    expect(logged).toHaveBeenCalledWith(error);
    expect(handler.crashed()).toBe(true);
  });
});
