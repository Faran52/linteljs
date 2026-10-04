import { Component } from '@angular/core';

import { ANSWERS, STACK } from '@config/linteljs';

import { t } from '@i18n';

import { CodeText } from '@ui/code-text/code-text';

// Recorded when the project was generated: a browser cannot read its machine's Node or package manager.
@Component({
  imports: [CodeText],
  selector: 'app-version',
  templateUrl: './version.html',
})
export class Version {
  protected readonly stack = STACK;

  protected readonly answers = ANSWERS;

  protected readonly recorded = {
    file: 'linteljs.config.json',
    command: 'sync',
  };

  protected readonly t = t;
}
