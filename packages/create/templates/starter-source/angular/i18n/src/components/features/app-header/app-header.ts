import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PAGES } from '../../../config/routes';
import {
  chooseLanguage,
  language,
  t,
  translateId,
} from '../../../i18n';
import { languages } from '../../../i18n/config';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  templateUrl: './app-header.html',
})
export class AppHeader {
  readonly name = input.required<string>();

  protected readonly pages = PAGES;

  protected readonly languages = languages;

  protected readonly language = language;

  protected readonly chooseLanguage = chooseLanguage;

  protected readonly t = t;

  protected readonly translateId = translateId;
}
