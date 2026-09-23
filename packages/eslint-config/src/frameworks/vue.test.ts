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

  /*
   * `for` is the documented way to bind a label to a control, and the rule's default demands the control sit
   * inside the label as well. A label bound to nothing is still reported, which is the half worth keeping.
   */
  it('accepts a label bound by for, and still reports one bound to nothing', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const messages = await messagesForFile(layer, join(SFC_FIXTURES, 'LabelledField.vue'));
    const labels = messages.filter((message) => {
      return message.ruleId === 'vuejs-accessibility/label-has-for';
    });

    expect(labels).toHaveLength(1);
    expect(labels[0]?.line).toBe(5);
  });

  // A parse error carries no rule id.
  it('still types a script block with the a11y preset in the layer', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const messages = await messagesForFile(layer, join(SFC_FIXTURES, 'Inaccessible.vue'));

    expect(messages.filter((message) => {
      return message.fatal === true;
    })).toEqual([]);
  });

  /**
   * The plugin's presets scope a `language: 'typescript'` rule to the four TypeScript extensions, so `base`
   * restates every one of them to reach a script block. `no-inline-object-types` was the one the restatement
   * missed: the fixture's `{ a: string } | { b: string }` trips both, and only `union-newline` reported.
   */
  it('reaches TypeScript inside a script block with the base rules the preset scopes to .ts', async () => {
    const layer = [...base(), ...typescript(), ...vue()];
    const ruleIds = await ruleIdsForFile(layer, join(SFC_FIXTURES, 'ScriptUnion.vue'));

    expect(ruleIds).toContain('@linteljs/union-newline');
    expect(ruleIds).toContain('@linteljs/no-inline-object-types');
  });
});
