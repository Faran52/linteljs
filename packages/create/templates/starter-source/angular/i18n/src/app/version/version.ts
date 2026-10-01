import { Component } from '@angular/core';

import { CodeText } from '../../components/ui/code-text/code-text';
import { ANSWERS, STACK } from '../../config/linteljs';
import { t } from '../../i18n';

// What was recorded at birth: a browser cannot read its machine's Node or package manager.
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
