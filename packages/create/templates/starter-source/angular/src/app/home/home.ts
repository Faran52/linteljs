import { Component } from '@angular/core';

import { Mark } from '../../components/ui/mark/mark';
import { NAME } from '../../config/linteljs';

@Component({
  imports: [Mark],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  protected readonly name = NAME;
}
