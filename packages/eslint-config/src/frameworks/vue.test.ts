import { join } from 'node:path';

import {
  messagesForFile,
  ruleIdsForFile,
  SFC_FIXTURES,
  startsWith,
} from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base';
import typescript from '../typescript';

import vue from './vue';

describe('vue', () => {
  it('parses a single-file component and reports on its template', async () => {
    const ruleIds = await ruleIdsForFile(vue(), join(SFC_FIXTURES, 'Home.vue'));

    expect(ruleIds).not.toContain(null);
    expect(ruleIds.some(startsWith('vue/'))).toBe(true);
  });

  // Real findings, not config: the a11y preset brings its own parser, and ours has to win with both reporting.
  it('reports accessibility findings on a template', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const ruleIds = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'Inaccessible.vue'));

    expect(ruleIds).toContain('vuejs-accessibility/alt-text');
    expect(ruleIds).toContain('vuejs-accessibility/click-events-have-key-events');
  });

  // A parse error carries no rule id.
  it('still types a script block with the a11y preset in the layer', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const messages = await messagesForFile(layer, join(SFC_FIXTURES, 'Inaccessible.vue'));

    expect(messages.filter((message) => {
      return message.fatal === true;
    })).toEqual([]);
  });

  // The plugin's `recommended` scopes `union-newline` to `.ts`; `base` widens it to reach a script block.
  it('reaches TypeScript inside a script block with the base rules the preset scopes to .ts', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const ruleIds = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'ScriptUnion.vue'));

    expect(ruleIds).toContain('@linteljs/union-newline');
  });
});
