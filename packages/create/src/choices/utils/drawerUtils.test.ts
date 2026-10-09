import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Catalog, type Drawer } from '../read/catalog/catalogReader';

import {
  answeredValues,
  drawersIn,
  givenValues,
} from './drawerUtils';

describe('givenValues', () => {
  it('lists an answer\'s values, none kept', () => {
    const single = givenValues({ form: 'none' }, 'form');
    const unanswered = givenValues({}, 'store');

    expect([single, unanswered]).toEqual([['none'], []]);
  });
});

describe('answeredValues', () => {
  it('lists an answer\'s values but none', () => {
    const single = answeredValues({ form: 'none' }, 'form');
    const multi = answeredValues({ languages: ['en', 'ja'] }, 'languages');
    const unanswered = answeredValues({}, 'store');

    expect([
      single,
      multi,
      unanswered,
    ]).toEqual([
      [],
      ['en', 'ja'],
      [],
    ]);
  });
});

describe('drawersIn', () => {
  it('reads any, then the picked styling\'s directory, css when none', () => {
    const drawer = (dir: string): Drawer => {
      const base: Drawer = {
        dir,
        name: 'base',
        key: null,
        value: '',
      };

      return base;
    };

    const any = drawer('any');
    const css = drawer('css');
    const catalog: Catalog = {
      drawers: [css, any],
      languages: [],
      agents: [],
    };
    const plain = drawersIn(catalog, { styling: 'none' });
    const tailwind = drawersIn(catalog, { styling: 'tailwind' });

    expect(plain).toEqual([any, css]);
    expect(tailwind).toEqual([any]);
  });
});
