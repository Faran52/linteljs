import { Component } from '@angular/core';

import { Mark } from '../../components/ui/mark/mark';
import { CHECK, NAME } from '../../config/linteljs';

@Component({
  imports: [Mark],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  protected readonly check = CHECK;

  protected readonly name = NAME;
}
