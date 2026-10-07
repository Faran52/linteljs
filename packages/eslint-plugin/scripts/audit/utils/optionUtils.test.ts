import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { configurationsFor, type OptionValue } from './optionUtils.ts';

const schemas = vi.hoisted(() => {
  return new Map<string, unknown>();
});

vi.mock('./lintUtils.ts', () => {
  const lintUtils = {
    moduleOf: (id: string) => {
      const rule = { meta: { schema: schemas.get(id) } };

      return rule;
    },
  };

  return lintUtils;
});

const sweep = (property: object): (OptionValue | undefined)[] => {
  schemas.set('rule', [{ properties: { option: property } }]);

  return configurationsFor('rule')
    .map((configuration) => {
      return configuration.options['rule']?.['option'];
    });
};

describe('configurationsFor', () => {
  it('labels each configuration and sets the one option it sweeps', () => {
    schemas.set('rule', [{ properties: { flag: { type: 'boolean' }, mode: { enum: ['a'] } } }]);

    const configurations = configurationsFor('rule');

    const expected = [
      {
        label: 'rule { flag: true }',
        options: { rule: { flag: true } },
        rule: 'rule',
      },
      {
        label: 'rule { flag: false }',
        options: { rule: { flag: false } },
        rule: 'rule',
      },
      {
        label: 'rule { mode: "a" }',
        options: { rule: { mode: 'a' } },
        rule: 'rule',
      },
    ];
    expect(configurations).toEqual(expected);
  });

  it.each([
    ['no schema', undefined],
    ['an object schema', { type: 'object' }],
    ['an empty schema list', []],
    ['a first entry without properties', [{ type: 'object' }]],
  ])('sweeps nothing for %s', (_label, schema) => {
    schemas.set('rule', schema);

    const configurations = configurationsFor('rule');

    expect(configurations).toEqual([]);
  });

  it('keeps the scalar values of an enum', () => {
    const values = sweep({ enum: [
      'a',
      1,
      true,
      null,
      ['b'],
      { c: 1 },
    ] });

    expect(values).toEqual([
      'a',
      1,
      true,
    ]);
  });

  it('prefers a boolean type over an enum', () => {
    const values = sweep({ type: 'boolean', enum: ['x'] });

    expect(values).toEqual([true, false]);
  });

  it('sizes an integer from its minimum, its default and past double it', () => {
    const values = sweep({
      type: 'integer',
      minimum: 1,
      default: 3,
    });

    expect(values).toEqual([
      1,
      3,
      8,
    ]);
  });

  it('starts an integer with no minimum at zero', () => {
    const values = sweep({ type: 'integer', default: 3 });

    expect(values).toEqual([
      0,
      3,
      8,
    ]);
  });

  it('extends a list of hook names with the two extra hooks', () => {
    const values = sweep({ type: 'array', default: ['useEffect'] });

    const expected = [['useEffect'], [
      'useEffect',
      'useLayoutEffect',
      'useImperativeHandle',
    ]];
    expect(values).toEqual(expected);
  });

  it.each([
    ['no default', undefined],
    ['a default of numbers', [1]],
    ['a default that is no list', 'a'],
  ])('stands the empty list in for an array with %s', (_label, fallback) => {
    const values = sweep({ type: 'array', default: fallback });

    expect(values).toEqual([[]]);
  });

  it.each([
    [
      'a string',
      { type: 'string' },
      '"string"',
    ],
    [
      'an integer without a default',
      { type: 'integer' },
      '"integer"',
    ],
    [
      'an integer with a string default',
      { type: 'integer', default: '3' },
      '"integer"',
    ],
    [
      'an untyped property',
      {},
      'undefined',
    ],
  ])('throws on %s', (_label, property, shown) => {
    const sweeping = (): (OptionValue | undefined)[] => {
      return sweep(property);
    };

    expect(sweeping).toThrow(`no values known for a schema property of type ${shown}`);
  });
});
