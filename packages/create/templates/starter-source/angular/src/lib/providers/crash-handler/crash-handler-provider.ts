import {
  type ErrorHandler,
  Injectable,
  signal,
} from '@angular/core';

import { ForbiddenError } from '@utils/status-utils';

// Angular's own handler only logs, so this one also names the status the shell swaps its outlet for.
@Injectable({ providedIn: 'root' })
export class CrashHandler implements ErrorHandler {
  readonly crash = signal<'forbidden' | 'serverError' | undefined>(undefined);

  handleError(error: unknown): void {
    console.error(error);
    this.crash.set(error instanceof ForbiddenError ? 'forbidden' : 'serverError');
  }
}
