import { Component, input } from '@angular/core';

import { Button } from '../../ui/button/button';

// Home is a full load, so a crash leaves no state behind.
@Component({
  imports: [Button],
  selector: 'app-status-page',
  templateUrl: './status-page.html',
})
export class StatusPage {
  readonly code = input.required<number>();

  readonly message = input.required<string>();

  readonly onRetry = input<() => void>();
}
