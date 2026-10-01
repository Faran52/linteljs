import { Component } from '@angular/core';

import { ANSWERS, STACK } from '@config/linteljs';

// What was recorded at birth: a browser cannot read its machine's Node or package manager.
@Component({
  selector: 'app-version',
  templateUrl: './version.html',
})
export class Version {
  protected readonly stack = STACK;

  protected readonly answers = ANSWERS;
}
