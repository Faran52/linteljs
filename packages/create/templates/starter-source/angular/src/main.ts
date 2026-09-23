import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

// A rejection value is genuinely unknown, which is one of the three spellings the type floor grants.
bootstrapApplication(App, appConfig).catch((err: unknown) => {
  console.error(err);
});
