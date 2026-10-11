import {
  Component,
  computed,
  input,
  output,
} from '@angular/core';

// A dense tool pane can get away with `aria-label` alone; a form cannot.
@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.html',
})
export class TextInput {
  readonly name = input.required<string>();

  readonly label = input.required<string>();

  readonly value = input.required<string>();

  readonly error = input<string>();

  readonly multiline = input(false);

  readonly type = input<'text' | 'email'>('text');

  readonly valueChange = output<string>();

  readonly blurred = output();

  protected readonly describedBy = computed(() => {
    return this.error() === undefined ? undefined : `${this.name()}-error`;
  });
}
