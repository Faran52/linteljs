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
import { applied } from './editUtils';
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
  const edits = filledOnce(text, file, sources);

  return edits === undefined ? undefined : applied(text, edits);
};

// The names a rewrite took a read of away.
const goneIn = (text: string, next: string): string[] => {
  const before = parse(text);
  const after = parse(next);

  return NAMES
    .filter((name) => {
      return referencesIn(after, name).length < referencesIn(before, name).length;
    });
};

describe('filledOnce', () => {
  it('fills by rank, one read per statement a pass, a type alone', () => {
    const sources = sourcesFor(BASE);
    const passes: string[][] = [];
    let text = sources.body;

    for (let next = stepOf(text, sources); next !== undefined; next = stepOf(text, sources)) {
      const gone = goneIn(text, next);

      passes.push(gone);
      text = next;
    }

    expect(passes).toStrictEqual([
      [
        'C',
        'k',
        'm',
        's',
        'v',
      ],
      ['T'],
      ['v'],
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

  it.each([
    [
      'a case at the top level, alone in its pass',
      'y = v;\ns();\n',
      [['s'], ['v']],
    ],
    [
      'a case as a statement, after an expression',
      's();\nz = m.a;\n',
      [['m'], ['s']],
    ],
    [
      'a case in a block, with the others',
      '{\n  s();\n}\nz = m.a;\n',
      [['m', 's']],
    ],
    [
      'an argument of a case, with the others',
      'f(v);\nz = m.a;\n',
      [['m', 'v']],
    ],
  ])('fills %s', (_name, body, expected) => {
    const sources = sourcesFor(`import { ${NAMES.join(', ')} } from './p';\n\n${body}`);
    const passes: string[][] = [];
    let text = sources.body;

    for (let next = stepOf(text, sources); next !== undefined; next = stepOf(text, sources)) {
      const gone = goneIn(text, next);

      passes.push(gone);
      text = next;
    }

    expect(passes).toStrictEqual(expected);
  });
});
