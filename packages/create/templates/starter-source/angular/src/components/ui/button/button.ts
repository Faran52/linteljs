import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
})
export class Button {
  readonly type = input<'button' | 'submit'>('button');

  readonly disabled = input(false);
}
