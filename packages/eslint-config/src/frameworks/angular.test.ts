import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base';

import angular, { angularGroup } from './angular';

import {
  ownBlockNames,
  ruleIdsFor,
  sortsAheadOfPackages,
  startsWith,
} from '#mocks/lintText';
import { layerWithoutConfig } from '#mocks/presets';

describe('angular', () => {
  /*
   * A component with no state of its own is normal Angular: it still has a template, a selector and a place in the
   * injector. Without the carve-out every presentational component in a project fails its own lint.
   */
  it('lets a decorated class carry nothing, and still refuses an undecorated one', async () => {
    const decorated = "@Component({ selector: 'app-mark' })\nexport class Mark {}\n";
    const bare = 'export class Bag {}\n';

    await expect(ruleIdsFor([...base(), ...angular()], decorated, 'src/app/mark.ts'))
      .resolves.not.toContain('@typescript-eslint/no-extraneous-class');
    await expect(ruleIdsFor([...base(), ...angular()], bare, 'src/app/bag.ts'))
      .resolves.toContain('@typescript-eslint/no-extraneous-class');
  });

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

  // The processor hands an inline template to the template rules as a virtual `.html` file.
  it('reports on a template written inline in a component', async () => {
    const code = [
      "@Component({ selector: 'app-logo', template: '<img src=\"/a.png\">' })",
      'export class LogoComponent {}',
      '',
    ].join('\n');
    const ruleIds = await ruleIdsFor(angular(), code, 'src/app/logo.component.ts');

    expect(ruleIds).toContain('@angular-eslint/template/alt-text');
  });

  it.each([
    '@angular/core',
    'rxjs',
    'rxjs/operators',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    await expect(sortsAheadOfPackages(base({ frameworkGroup: angularGroup }), specifier)).resolves.toBe(true);
  });

  it('names every block it writes', () => {
    expect(ownBlockNames(angular())).toEqual([
      '@linteljs/angular/inline-templates',
      '@linteljs/angular/decorated-classes',
    ]);
  });

  it.each([
    ['tsRecommended', 'angular-eslint/tsRecommended'],
    ['templateRecommended', 'angular-eslint/template'],
    ['templateAccessibility', 'angular-eslint/templateAccessibility'],
  ])('names %s when angular-eslint stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('angular-eslint', key, async () => {
      return (await import('./angular')).angular;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
