import { Component } from '@angular/core';

import { CHECK, GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { t } from '@i18n';

import { CodeText } from '@ui/code-text/code-text';

@Component({
  imports: [CodeText],
  selector: 'app-about',
  templateUrl: './about.html',
})
export class About {
  protected readonly check = CHECK;

  protected readonly gate = GATE;

  protected readonly standardPaths = STANDARD_PATHS;

  protected readonly sync = 'npx @linteljs/create sync';

  protected readonly t = t;
}
