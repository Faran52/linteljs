import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

import { AppHeader } from '../components/features/app-header/app-header';
import { NAME } from '../config/linteljs';

@Component({
  imports: [RouterOutlet, AppHeader],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly name = NAME;

  // The name lives in code, so the title is set here rather than in `index.html`.
  constructor() {
    inject(Title).setTitle(NAME);
  }
}
