import { rules } from '../../../../src/rules/registry.ts';

import { SHAPES, TS_ONLY_RULES } from './shapesUtils.ts';

describe('SHAPES', () => {
  it('names only rules the plugin ships', () => {
    const unknown = Object.keys(SHAPES)
      .filter((rule) => {
        return !Object.hasOwn(rules, rule);
      });

    expect(unknown).toStrictEqual([]);
  });

  it('gives every shape of a rule its own name', () => {
    const repeated = Object.entries(SHAPES)
      .filter(([, shapes]) => {
        const names = new Set(shapes
          .map((shape) => {
            return shape.shape;
          }));

        return names.size !== shapes.length;
      });

    expect(repeated).toStrictEqual([]);
  });
});

describe('TS_ONLY_RULES', () => {
  it('names only rules that have shapes', () => {
    const unshaped = [...TS_ONLY_RULES]
      .filter((rule) => {
        return !Object.hasOwn(SHAPES, rule);
      });

    expect(unshaped).toStrictEqual([]);
  });
});
