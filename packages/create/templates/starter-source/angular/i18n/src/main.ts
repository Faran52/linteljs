import { bootstrapApplication } from '@angular/platform-browser';

import { applyLanguage, detectLanguage } from '@i18n';

import { App } from './app/app';
import { appConfig } from './app/app.config';

applyLanguage(detectLanguage());

// A rejection value is genuinely unknown, which is one of the three spellings the type floor grants.
bootstrapApplication(App, appConfig)
  .catch((err: unknown) => {
    console.error(err);
  });
