import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

import { AppHeader } from '../components/features/app-header/app-header';
import { NAME } from '../config/linteljs';

@Component({
  imports: [RouterOutlet, AppHeader],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly name = NAME;

  // Angular has no static place for the title: `index.html` is written before the name is known.
  constructor() {
    inject(Title).setTitle(NAME);
  }
}
