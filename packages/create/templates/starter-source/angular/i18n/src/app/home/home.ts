import { Component } from '@angular/core';

import { CHECK, NAME } from '@config/linteljs';

import { t } from '@i18n';

import { CodeText } from '@ui/code-text/code-text';
import { Mark } from '@ui/mark/mark';

@Component({
  imports: [CodeText, Mark],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  protected readonly check = CHECK;

  protected readonly name = NAME;

  protected readonly t = t;
}
