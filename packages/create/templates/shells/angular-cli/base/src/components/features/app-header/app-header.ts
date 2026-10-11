import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PAGES } from '@config/routes';

import { t, translateId } from '@i18n/i18n';

import { LanguageSelect } from '../language-select/language-select';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    LanguageSelect,
  ],
  selector: 'app-header',
  templateUrl: './app-header.html',
})
export class AppHeader {
  readonly name = input.required<string>();

  protected readonly pages = PAGES;

  protected readonly t = t;

  protected readonly translateId = translateId;
}
