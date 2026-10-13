import { Component, inject } from '@angular/core';

import { CHECK, NAME } from '@config/linteljs';

import { CounterStore } from '@store/counter/counter-store';
import { t } from '@i18n/i18n';

import { Button } from '@ui/button/button';
import { CodeText } from '@ui/code-text/code-text';
import { Mark } from '@ui/mark/mark';

import { styles } from './home.styles';

@Component({
  imports: [
    Button,
    CodeText,
    Mark,
  ],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  protected readonly counter = inject(CounterStore);

  protected readonly check = CHECK;

  protected readonly name = NAME;

  protected readonly t = t;

  protected readonly styles = styles;
}
