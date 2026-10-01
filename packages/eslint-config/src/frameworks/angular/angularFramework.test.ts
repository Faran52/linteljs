import {
  codeLines,
  ownBlockNames,
  ruleIdsFor,
  sortsAheadOfPackages,
  startsWith,
} from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';

import angular, { angularGroup } from './angularFramework';

describe('angular', () => {
  it('lets a decorated class carry nothing, and still refuses an undecorated one', async () => {
    const decorated = "@Component({ selector: 'app-mark' })\nexport class Mark {}\n";
    const bare = 'export class Bag {}\n';

    await expect(ruleIdsFor([...base(), ...angular()], decorated, 'src/app/mark.ts'))
      .resolves.not.toContain('@typescript-eslint/no-extraneous-class');

    await expect(ruleIdsFor([...base(), ...angular()], bare, 'src/app/bag.ts'))
      .resolves.toContain('@typescript-eslint/no-extraneous-class');
  });

  it('caps a component class file at 500 lines of code', async () => {
    const component = (lines: number): string => {
      return `@Component({ selector: 'app-big' })\nexport class Big {}\n${codeLines(lines - 2)}`;
    };

    const atLimit = await ruleIdsFor([...base(), ...angular()], component(500), 'src/app/big.component.ts');
    const overLimit = await ruleIdsFor([...base(), ...angular()], component(501), 'src/app/big.component.ts');

    expect(atLimit).not.toContain(null);
    expect(atLimit).not.toContain('max-lines');
    expect(overLimit).toContain('max-lines');
  });

  it('caps a component method at 350 lines', async () => {
    const component = (lines: number): string => {
      const method = `  run(): void {\n${codeLines(lines - 2, '    ')}  }\n`;

      return `@Component({ selector: 'app-big' })\nexport class Big {\n${method}}\n`;
    };

    const atLimit = await ruleIdsFor([...base(), ...angular()], component(350), 'src/app/big.component.ts');
    const overLimit = await ruleIdsFor([...base(), ...angular()], component(351), 'src/app/big.component.ts');

    expect(atLimit).not.toContain(null);
    expect(atLimit).not.toContain('max-lines-per-function');
    expect(overLimit).toContain('max-lines-per-function');
  });

  it('reports on a template', async () => {
    const code = '<div *ngIf="on">{{ label }}</div>\n<button (click)="go()"></button>\n';
    const ruleIds = await ruleIdsFor(angular(), code, 'src/app/home.component.html');

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
      return (await import('./angularFramework')).angular;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
