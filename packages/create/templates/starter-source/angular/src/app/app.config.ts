import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import type { ApplicationConfig } from '@angular/core';

// Everything the application is provided at its root. A service belongs at the narrowest scope that works, so
// what goes here is what every route genuinely shares.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ],
};
