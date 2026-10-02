import {
  enabledRuleIdsFor,
  frameworkRuleIdsFor,
  ownBlockNames,
  ruleIdsFor,
  startsWith,
} from '@mocks/lintText';
import { layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base/baseLayer';
import typescript from '../typescript/typescriptLayer';

import html from './htmlLayer';

const NO_ALT = '<!doctype html>\n<html lang="en">\n  <body><img src="a.png"></body>\n</html>\n';

describe('html', () => {
  it('reports an img with no alt', async () => {
    const ruleIds = await ruleIdsFor(html(), NO_ALT, 'index.html');
    expect(ruleIds).toContain('@html-eslint/require-img-alt');
  });

  it('enables no html rule on a TypeScript file', async () => {
    const enabled = await enabledRuleIdsFor([...base(), ...html()], 'src/lib/utils/sample.ts');

    const filtered = enabled.filter(startsWith('@html-eslint/'));
    expect(filtered).toEqual([]);
  });

  it('survives composition with the type-aware layer', async () => {
    const ruleIds = await ruleIdsFor([
      ...base(),
      ...typescript(),
      ...html(),
    ], NO_ALT, 'index.html');
    expect(ruleIds).toContain('@html-eslint/require-img-alt');
  });

  it.each([
    'src/index.html',
    'src/lib/utils/sample.ts',
  ])('enables no framework rule on %s', async (file) => {
    const leaked = await frameworkRuleIdsFor([...base(), ...html()], file);

    expect(leaked).toStrictEqual([]);
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(html());
    const expected = [
      '@linteljs/html',
    ];
    expect(actual).toEqual(expected);
  });

  it.each([
    ['flat/recommended', 'html-eslint/flat/recommended'],
  ])('names %s when @html-eslint/eslint-plugin stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('@html-eslint/eslint-plugin', key, async () => {
      return (await import('./htmlLayer')).html;
    });

    expect(layer).toThrow(`${label} is not published`);
  });
});
