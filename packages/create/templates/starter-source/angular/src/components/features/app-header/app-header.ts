import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PAGES } from '../../../config/routes';

@Component({
  imports: [RouterLink, RouterLinkActive],
  // No `styleUrl`: the global stylesheet reaches a component's DOM either way.
  selector: 'app-header',
  templateUrl: './app-header.html',
})
export class AppHeader {
  readonly name = input.required<string>();

  protected readonly pages = PAGES;
}
