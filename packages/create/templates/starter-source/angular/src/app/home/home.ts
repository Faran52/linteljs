import { Component } from '@angular/core';

import { CHECK, NAME } from '@config/linteljs';

import { Mark } from '@ui/mark/mark';

@Component({
  imports: [Mark],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  protected readonly check = CHECK;

  protected readonly name = NAME;
}
