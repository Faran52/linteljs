import {
  Component,
  computed,
  input,
} from '@angular/core';

import { styles } from './code-text.styles';

export type CodeTone = keyof typeof styles;

// A translation marks each command `<code>`: split here, so no message is rendered as HTML.
@Component({
  selector: 'app-code-text',
  templateUrl: './code-text.html',
})
export class CodeText {
  readonly text = input.required<string>();

  readonly tone = input<CodeTone>();

  protected readonly parts = computed(() => {
    const text = this.text();

    return text.split(/<\/?code>/u);
  });

  protected readonly toneClass = computed(() => {
    const tone = this.tone();

    return tone === undefined ? undefined : styles[tone].class;
  });
}
