import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Sources,
  sourcesOf,
  type Trust,
} from './bindingUtils';
import { filledOnce } from './inlineUtils';
import { parse, referencesIn } from './sourceUtils';

const NO_TRUST: Trust = {
  plainData: [],
  pureCalls: [],
};

const NAMES = [
  'C',
  'k',
  'm',
  's',
  'T',
  'v',
];

const BASE = [
  `import { ${NAMES.join(', ')} } from './p';`,
  '',
  'interface P extends T {',
  '}',
  'y = [v, f(v)];',
  '{',
  '  const h = s();',
  '}',
  'q = k();',
  'z = m.a;',
  'w = <C></C>;',
  '',
].join('\n');

const OPTION = [
  'export interface T {',
  '  a: 1;',
  '}',
  'export const v = 1;',
  'export const s = () => {',
  '  log();',
  '};',
  'export const k = () => 5;',
  'export const m = { a: 2 };',
  'export const C = () => <hr />;',
  '',
].join('\n');

const sourcesFor = (base: string): Sources => {
  return sourcesOf(base, { './p': OPTION }, {}, NO_TRUST);
};

const stepOf = (text: string, sources: Sources): string | undefined => {
  const file = parse(text);

  return filledOnce(text, file, sources);
};

const remaining = (text: string): string[] => {
  const file = parse(text);

  return NAMES
    .filter((name) => {
      return referencesIn(file, name).length > 0;
    });
};

describe('filledOnce', () => {
  it('fills one read at a time: elements, then members and calls, statements, types and plain values', () => {
    const sources = sourcesFor(BASE);
    const order: string[] = [];
    let text = sources.body;

    for (let next = stepOf(text, sources); next !== undefined; next = stepOf(text, sources)) {
      const [gone] = remaining(text)
        .filter((name) => {
          return !remaining(next).includes(name);
        });

      order.push(gone ?? 'v');
      text = next;
    }

    expect(order).toStrictEqual([
      'C',
      'k',
      'm',
      's',
      'T',
      'v',
      'v',
    ]);

    expect(text).toBe('interface P {\n  a: 1;\n}\ny = [1, f(1)];\n{\n  log();\n}\nq = 5;\nz = 2;\nw = <hr />;\n');
  });

  it('answers undefined when no parameter binding is read', () => {
    const sources = sourcesFor('import { v } from \'./p\';\n\ny = { v: 1 }.v;\n');
    const next = stepOf(sources.body, sources);

    expect(next).toBeUndefined();
  });

  it('leaves a read of a name the text binds again, which is not the parameter binding', () => {
    const sources = sourcesFor('import { v } from \'./p\';\n\ny = (v: number) => v;\n');
    const next = stepOf(sources.body, sources);

    expect(next).toBeUndefined();
  });
});
