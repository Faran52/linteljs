import { Component } from '@angular/core';

import { CHECK, GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
})
export class About {
  protected readonly check = CHECK;

  protected readonly gate = GATE;

  protected readonly standardPaths = STANDARD_PATHS;
}
