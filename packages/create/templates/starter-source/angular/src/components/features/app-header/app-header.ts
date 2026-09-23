import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PAGES } from '../../../config/routes';

/*
 * The one place the routing is visible. `routerLinkActive` is what marks the tab you are on, and it does it
 * without the component knowing where you are, which is why there is no state here at all.
 */
@Component({
  imports: [RouterLink, RouterLinkActive],
  // No `styleUrl`: the header's rules are in the global stylesheet, which reaches a component's DOM either way.
  selector: 'app-header',
  templateUrl: './app-header.html',
})
export class AppHeader {
  readonly name = input.required<string>();

  protected readonly pages = PAGES;
}
