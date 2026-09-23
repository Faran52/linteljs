import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

import { AppHeader } from '../components/features/app-header/app-header';
import { NAME } from '../config/linteljs';

/*
 * The application's root, which is the header and whatever the router put under it. Standalone, like every
 * component here: there is no `NgModule` in this project and no reason to add one.
 */
@Component({
  imports: [RouterOutlet, AppHeader],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly name = NAME;

  // The document's title, which Angular has no static place for: `index.html` is written before the name is known.
  constructor() {
    inject(Title).setTitle(NAME);
  }
}
