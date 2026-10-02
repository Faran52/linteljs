import {
  type ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { CrashHandler } from '@lib/providers/crash-handler/crash-handler';

import { routes } from './app.routes';

const routing = provideRouter(routes, withComponentInputBinding());

// A service belongs at the narrowest scope that works; this is what every route shares.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    routing,
    {
      provide: ErrorHandler,
      useExisting: CrashHandler,
    },
  ],
};
