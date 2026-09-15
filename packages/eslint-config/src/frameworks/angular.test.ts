import { ruleIdsFor, startsWith } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import angular from './angular';

describe('angular', () => {
  it('reports on a template', async () => {
    const code = '<div *ngIf="on">{{ label }}</div>\n<button (click)="go()"></button>\n';
    const ruleIds = await ruleIdsFor(angular(), code, 'src/app/home.component.html');

    // A `null` id is a fatal parser error; an empty template ruleset would pass that alone.
    expect(ruleIds).not.toContain(null);
    expect(ruleIds.some(startsWith('@angular-eslint/'))).toBe(true);
  });

  it('reports accessibility findings on a template', async () => {
    const code = '<img src="/logo.png">\n<div (click)="go()">go</div>\n';
    const ruleIds = await ruleIdsFor(angular(), code, 'src/app/home.component.html');

    expect(ruleIds).toContain('@angular-eslint/template/alt-text');
    expect(ruleIds).toContain('@angular-eslint/template/click-events-have-key-events');
  });

  it('reports a component class that breaks an angular-eslint convention', async () => {
    const code = [
      "import { Component } from '@angular/core';",
      '',
      "@Component({ selector: 'app-home', template: '' })",
      'export class HomeComponent {',
      '  ngOnInit() {}',
      '}',
      '',
    ].join('\n');
    const ruleIds = await ruleIdsFor(angular(), code, 'src/app/home.component.ts');

    expect(ruleIds.some(startsWith('@angular-eslint/'))).toBe(true);
  });
});
