import { Component } from '@angular/core';

import { GATE, STANDARD_PATHS } from '../../config/standard';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
})
export class About {
  protected readonly gate = GATE;

  protected readonly standardPaths = STANDARD_PATHS;
}
