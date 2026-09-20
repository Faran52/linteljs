import {
  describe,
  expect,
  it,
} from 'vitest';

import { createRule, docsUrl } from './types.ts';

describe('docsUrl', () => {
  it('builds the rule directory url from the rule id', () => {
    expect(docsUrl('import-newlines'))
      .toBe('https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/import-newlines');
  });

  it('points at a tree url rather than a blob url', () => {
    expect(docsUrl('prefer-arrow-functions')).toContain('/tree/main/');
    expect(docsUrl('prefer-arrow-functions')).not.toContain('/blob/');
  });
});

describe('createRule', () => {
  const definition: Parameters<typeof createRule>[1] = {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'A rule for exercising createRule.',
        language: 'universal',
        recommended: true,
      },
      messages: { example: 'An example message.' },
      schema: [],
    },
    create: () => {
      return {};
    },
  };

  it('derives the docs url from the rule name it is given, not from anything on the definition', () => {
    const rule = createRule('example-rule', definition);

    expect(rule.meta.docs.url)
      .toBe('https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/example-rule');
  });

  it('carries every other docs field through unchanged', () => {
    const rule = createRule('example-rule', definition);

    expect(rule.meta.docs.description).toBe('A rule for exercising createRule.');
    expect(rule.meta.docs.language).toBe('universal');
    expect(rule.meta.docs.language).toBe('universal');
    expect(rule.meta.docs.recommended).toBe(true);
  });

  it('carries the rest of meta through unchanged', () => {
    const rule = createRule('example-rule', definition);

    expect(rule.meta.type).toBe('suggestion');
    expect(rule.meta.messages).toEqual({ example: 'An example message.' });
    expect(rule.meta.schema).toEqual([]);
  });

  it('carries the create function through by reference', () => {
    const rule = createRule('example-rule', definition);

    expect(rule.create).toBe(definition.create);
  });

  it('does not write the url back onto the definition passed in', () => {
    createRule('example-rule', definition);

    expect('url' in definition.meta.docs).toBe(false);
  });
});
