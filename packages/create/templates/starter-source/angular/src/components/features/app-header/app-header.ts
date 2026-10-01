import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PAGES } from '@config/routes';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  templateUrl: './app-header.html',
})
export class AppHeader {
  readonly name = input.required<string>();

  protected readonly pages = PAGES;
}
