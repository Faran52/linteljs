import { Component, input } from '@angular/core';

import { styles } from './button.styles';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
})
export class Button {
  readonly type = input<'button' | 'submit'>('button');

  readonly disabled = input(false);

  readonly busy = input(false);

  protected readonly styles = styles;
}
