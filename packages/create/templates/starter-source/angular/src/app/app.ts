import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

import { AppHeader } from '../components/features/app-header/app-header';
import { StatusPage } from '../components/features/status-page/status-page';
import { NAME } from '../config/linteljs';
import { STATUSES } from '../config/statuses';
import { CrashHandler } from '../lib/providers/crash-handler/crash-handler';

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

  protected readonly serverError = STATUSES.serverError;

  protected readonly crashed = inject(CrashHandler).crashed;

  protected readonly retry = (): void => {
    this.crashed.set(false);
  };

  // The name lives in code, so the title is set here rather than in `index.html`.
  constructor() {
    inject(Title).setTitle(NAME);
  }
}
