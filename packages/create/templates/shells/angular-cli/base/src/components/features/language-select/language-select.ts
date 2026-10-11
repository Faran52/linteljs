import { Component } from '@angular/core';

import { languages } from '@i18n/config';
import {
  chooseLanguage,
  language,
  t,
} from '@i18n/i18n';

@Component({
  selector: 'app-language-select',
  templateUrl: './language-select.html',
})
export class LanguageSelect {
  protected readonly languages = languages;

  protected readonly language = language;

  protected readonly chooseLanguage = chooseLanguage;

  protected readonly t = t;
}
