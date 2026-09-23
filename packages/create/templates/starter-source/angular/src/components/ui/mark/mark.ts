import { Component } from '@angular/core';

/*
 * A beam, and three lines that come into line with it. The beam never moves: it is the standard, and the lines are
 * the files. Pure SVG and CSS, so every framework receives the same markup rather than its own animation, and the
 * drift each line travels lives in the stylesheet rather than in a style attribute.
 */
@Component({
  selector: 'app-mark',
  templateUrl: './mark.html',
})
export class Mark {}
