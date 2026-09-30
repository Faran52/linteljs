import {
  type ErrorHandler,
  Injectable,
  signal,
} from '@angular/core';

// Angular's own handler only logs, so this one also raises the flag the shell swaps its outlet on.
@Injectable({ providedIn: 'root' })
export class CrashHandler implements ErrorHandler {
  readonly crashed = signal(false);

  handleError(error: unknown): void {
    console.error(error);
    this.crashed.set(true);
  }
}
