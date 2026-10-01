import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

import { NAME } from '@config/linteljs';
import { STATUSES } from '@config/statuses';

import { CrashHandler } from '@lib/providers/crash-handler/crash-handler';

import { AppHeader } from '@features/app-header/app-header';
import { StatusPage } from '@features/status-page/status-page';

@Component({
  imports: [
    RouterOutlet,
    AppHeader,
    StatusPage,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly name = NAME;

  protected readonly statuses = STATUSES;

  // Trying again cannot grant access, so only the 500 page is handed a retry.
  protected readonly crash = inject(CrashHandler).crash;

  protected readonly retry = (): void => {
    this.crash.set(undefined);
  };

  // The name lives in code, so the title is set here rather than in `index.html`.
  constructor() {
    inject(Title).setTitle(NAME);
  }
}
