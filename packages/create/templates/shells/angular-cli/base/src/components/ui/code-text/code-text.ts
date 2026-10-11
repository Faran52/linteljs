import {
  Component,
  computed,
  input,
} from '@angular/core';

// A translation marks each command `<code>`: split here, so no message is rendered as HTML.
@Component({
  selector: 'app-code-text',
  templateUrl: './code-text.html',
})
export class CodeText {
  readonly text = input.required<string>();

  protected readonly parts = computed(() => {
    const text = this.text();

    return text.split(/<\/?code>/u);
  });
}
