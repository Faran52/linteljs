import ts from 'typescript';
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
import { returnedOf } from './callUtils';
import {
  applied,
  type Edit,
  editOf,
  editOver,
  plain,
} from './editUtils';
import { scopeOf } from './scopeUtils';
import {
  collect,
  parse,
  type Span,
} from './sourceUtils';
import {
  batched,
  type Candidate,
  checked,
  landedCheck,
  settled,
  wellFormed,
} from './stepUtils';

interface Landing {
  checker: ts.TypeChecker;
  sources: Sources;
  owner: ts.Node;
  moved: ts.Node;
  landing: ts.Node;
}

type Answer = (identifier: ts.Identifier) => readonly Edit[] | undefined;

const NO_TRUST: Trust = {
  plainData: [],
  pureCalls: [],
};

const BASE = 'import fs, * as all from \'node:fs\';\nimport { join } from \'node:path\';\nimport { x } from \'./p\';\n';
const OPTION = 'const helper = 1;\n\nexport const x = helper;\nexport interface Local {}\n';

const sourcesFor = (): Sources => {
  return sourcesOf(BASE, { './p': OPTION }, {}, NO_TRUST);
};

// The first `a` of a text written as `insert`, or nothing once none is left.
const firstA = (text: string, insert: string): Edit[] | undefined => {
  const at = text.indexOf('a');
  const span: Span = {
    start: at,
    end: at + 1,
  };

  const written = plain(insert);
  const edits = [editOf(span, written)];

  return at === -1 ? undefined : edits;
};

// A one-letter text turned from `a` to `b` and back, so it changes every step and never settles.
const flipped = (text: string): Edit[] => {
  const span: Span = {
    start: 0,
    end: 1,
  };
  const written = plain(text === 'a' ? 'b' : 'a');
  const edits = [editOf(span, written)];

  return edits;
};

describe('settled', () => {
  it('applies a rewrite until it has nothing left to do', () => {
    const start = parse('aaa');
    const { text } = settled(start, (current) => {
      return firstA(current, 'b');
    });

    expect(text).toBe('bbb');
  });

  it('shows each rewrite, as the text before it and its edits, to the watch', () => {
    const seen: string[] = [];
    const start = parse('aa');

    settled(start, (current) => {
      return firstA(current, 'b');
    }, (before, edits) => {
      const after = applied(before, edits);

      seen.push(`${before}>${after}`);
    });

    expect(seen).toStrictEqual(['aa>ba', 'ba>bb']);
  });

  it('refuses at once a rewrite that answers no edits, which is not done', () => {
    const asked: string[] = [];

    const run = (): ts.SourceFile => {
      const start = parse('a');

      return settled(start, (text) => {
        asked.push(text);

        return [];
      });
    };

    expect(run).toThrow(/left the module as it was/u);
    expect(asked).toStrictEqual(['a']);
  });

  it('refuses at once a rewrite that writes the text as it was', () => {
    const seen: string[] = [];

    const run = (): ts.SourceFile => {
      const start = parse('a');

      return settled(start, (text) => {
        return firstA(text, 'a');
      }, (before) => {
        seen.push(before);
      });
    };

    expect(run).toThrow(/left the module as it was/u);
    expect(seen).toStrictEqual([]);
  });

  it('asks for ten thousand rewrites before it refuses', () => {
    const asked: string[] = [];

    const run = (): ts.SourceFile => {
      const start = parse('a');

      return settled(start, (text) => {
        asked.push(text);

        // A limit that is never reached fails here rather than looping on.
        if (asked.length > 10_000) {
          throw new Error('asked past the limit');
        }

        return flipped(text);
      });
    };

    expect(run).toThrow(/did not settle/u);
    expect(asked).toHaveLength(10_000);
  });
});

const upper: Answer = (identifier) => {
  const written = plain(identifier.text.toUpperCase());
  const edits = [editOver(identifier, written)];

  return edits;
};

// Each name of a text a candidate written in capitals, or as `answer` gives it for the names it knows.
const candidatesOf = (
  file: ts.SourceFile,
  answers: Readonly<Record<string, Answer>>,
  alone: readonly string[],
): Candidate[] => {
  return collect(file, ts.isIdentifier)
    .map((identifier) => {
      const answer = answers[identifier.text] ?? upper;
      const candidate: Candidate = {
        node: identifier,
        isAlone: () => {
          return alone.includes(identifier.text);
        },
        edits: () => {
          return answer(identifier);
        },
      };

      return candidate;
    });
};

// The text as one batched pass over `candidates` writes it.
const writtenBy = (text: string, candidates: readonly Candidate[]): string => {
  const edits = batched(text, candidates);

  return edits === undefined ? text : applied(text, edits);
};

const passOf = (text: string, answers: Readonly<Record<string, Answer>>, alone: readonly string[]): string => {
  const file = parse(text);
  const candidates = candidatesOf(file, answers, alone);

  return writtenBy(text, candidates);
};

const atEnd: Answer = (identifier) => {
  const end = identifier.getSourceFile().text.length;
  const span: Span = {
    start: end,
    end,
  };
  const written = plain('x;');
  const edits = [editOf(span, written)];

  return edits;
};

const atStart: Answer = () => {
  const span: Span = {
    start: 0,
    end: 0,
  };
  const written = plain('x;');
  const edits = [editOf(span, written)];

  return edits;
};

// The name in capitals, and the text's end marked too.
const alsoAtEnd: Answer = (identifier) => {
  const end = identifier.getSourceFile().text.length;
  const span: Span = {
    start: end,
    end,
  };
  const capitals = plain(identifier.text.toUpperCase());
  const marked = plain('x;');
  const edits = [editOver(identifier, capitals), editOf(span, marked)];

  return edits;
};

// The whole statement of the name, in capitals.
const wholeStatement: Answer = (identifier) => {
  const { parent } = identifier;
  const written = plain(parent
    .getText()
    .toUpperCase());
  const edits = [editOver(parent, written)];

  return edits;
};

const refused: Answer = () => {
  throw new Error('refused');
};

const nothing: Answer = () => {
  return undefined;
};

describe('batched', () => {
  it('rewrites the first of each statement on lines of its own in one pass', () => {
    const text = passOf('a + b;\nc;\nd; e;\n', {}, []);

    expect(text).toBe('A + b;\nC;\nd; e;\n');
  });

  it('rewrites alone a first candidate that may change what others read', () => {
    const text = passOf('a;\nb;\n', {}, ['a']);

    expect(text).toBe('A;\nb;\n');
  });

  it('leaves for a later pass the statement of a later candidate that may change what others read', () => {
    const text = passOf('a;\nb + c;\nd;\n', {}, ['b']);

    expect(text).toBe('A;\nb + c;\nD;\n');
  });

  it('rewrites alone a first candidate whose edits reach past its statement', () => {
    const text = passOf('a;\nb;', { a: atEnd }, []);

    expect(text).toBe('a;\nb;x;');
  });

  it('leaves for a later pass the statement of a later candidate whose edits reach past it', () => {
    const text = passOf('a;\nb + c;\nd;\n', { b: atEnd }, []);

    expect(text).toBe('A;\nb + c;\nD;\n');
  });

  it('joins only the candidates after the first, whatever their order in the text', () => {
    const text = 'a;\nb + c;\n';
    const file = parse(text);
    const order = [
      'b',
      'a',
      'c',
    ];
    const candidates = candidatesOf(file, { b: nothing }, ['b'])
      .toSorted((left, right) => {
        const leftAt = order.indexOf(left.node.getText());
        const rightAt = order.indexOf(right.node.getText());

        return leftAt - rightAt;
      });
    const written = writtenBy(text, candidates);

    expect(written).toBe('A;\nb + C;\n');
  });

  it('rewrites alone a first candidate whose edits reach before its statement', () => {
    const text = passOf('a;\nb;\nc;\n', {
      a: nothing,
      b: atStart,
    }, []);

    expect(text).toBe('x;a;\nb;\nc;\n');
  });

  it('leaves for a later pass the statement of a later candidate whose edits reach before it', () => {
    const text = passOf('a;\nb + c;\nd;\n', { b: atStart }, []);

    expect(text).toBe('A;\nb + c;\nD;\n');
  });

  it('rewrites alone a first candidate one of whose edits reaches past its statement', () => {
    const text = passOf('a;\nb;', { a: alsoAtEnd }, []);

    expect(text).toBe('A;\nb;x;');
  });

  it('leaves for a later pass the statement of a later candidate one of whose edits reaches past it', () => {
    const text = passOf('a;\nb + c;\nd;\n', { b: alsoAtEnd }, []);

    expect(text).toBe('A;\nb + c;\nD;\n');
  });

  it('joins a later candidate whose edit ends where its statement does', () => {
    const text = passOf('a;\nb;\n', { b: wholeStatement }, []);

    expect(text).toBe('A;\nB;\n');
  });

  it('refuses as a later candidate is refused', () => {
    const run = (): string => {
      return passOf('a;\nb;\nc;\nd;\n', { c: refused }, []);
    };

    expect(run).toThrow('refused');
  });

  it('refuses as the first candidate is refused', () => {
    const run = (): string => {
      return passOf('a;\nb;\n', { a: refused }, []);
    };

    expect(run).toThrow('refused');
  });

  it('passes over a candidate with nothing to rewrite', () => {
    const text = passOf('a;\nb + c;\nd + e;\n', {
      a: nothing,
      b: nothing,
      d: nothing,
    }, []);

    expect(text).toBe('a;\nb + C;\nd + E;\n');
  });

  it('answers undefined when no candidate rewrites', () => {
    const file = parse('a;\n');
    const candidates = collect(file, ts.isIdentifier)
      .map((identifier) => {
        const candidate: Candidate = {
          node: identifier,
          isAlone: () => {
            return false;
          },
          edits: () => {
            return undefined;
          },
        };

        return candidate;
      });
    const edits = batched(file.text, candidates);

    expect(edits).toBeUndefined();
  });
});

describe('checked', () => {
  it.each([
    ['export const y = 1;\n'],
    ['export const y = { x: 1, helper: 2 };\n'],
    ['const helper = 2;\n\nexport const y = helper;\n'],
    ['interface Local {}\n\nexport type Y = Local;\n'],
    ['export const y = [fs, all, join];\n'],
    ['export const lazy = () => import(\'./other\');\nexport type T = typeof import(\'lib\');\n'],
    ['export { a } from \'./other\';\nexport const s = \'./p\';\nf(\'./p\');\nexport type S = \'./p\';\n'],
  ])('answers the parsed module for %j', (text) => {
    const sources = sourcesFor();
    const parsed = parse(text);
    const file = checked(parsed, sources);

    expect(file).toBe(parsed);
  });

  it('refuses a parameter binding that is still read', () => {
    const run = (): ts.SourceFile => {
      const sources = sourcesFor();

      const file = parse('export const y = x;\n');

      return checked(file, sources);
    };

    expect(run).toThrow(/is left after composing: x/u);
  });

  it.each([
    ['export const lazy = () => import(\'./p\');\n', 'import(\'./p\')'],
    ['export type T = typeof import(\'./p\');\n', 'typeof import(\'./p\')'],
    ['export { x } from \'./p\';\n', 'export { x } from \'./p\';'],
    ['export * from \'./p\';\n', 'export * from \'./p\';'],
    ['import p = require(\'./p\');\n', 'require(\'./p\')'],
    ['export const s = \'./p\';\nexport const lazy = () => import(\'./p\');\n', 'import(\'./p\')'],
  ])('refuses a parameter module named in %j', (text, shown) => {
    const run = (): ts.SourceFile => {
      const sources = sourcesFor();
      const file = parse(text);

      return checked(file, sources);
    };

    expect(run).toThrow(`A parameter module is named where nothing fills it, so its option would be lost: ${shown}`);
  });

  it('refuses a directive that is still written', () => {
    const run = (): ts.SourceFile => {
      const sources = sourcesFor();

      const file = parse('export const y = 1; // @lintel:comment ./p#note\n');

      return checked(file, sources);
    };

    expect(run).toThrow(/is left after composing: @lintel:/u);
  });

  it('answers a base binding that shadows a parameter binding, which reads what its author meant', () => {
    const sources = sourcesFor();
    const parsed = parse('export const y = (x: number) => x;\n');
    const file = checked(parsed, sources);

    expect(file.statements).toHaveLength(1);
  });
});

// The option's `v` lands on the first read of `v` in the base: its value, or what its arrow returns.
// Where `v` of the option `./p` lands in the base, with other options beside it.
const landingAmong = (base: string, options: Readonly<Record<string, string>>): Landing => {
  const sources = sourcesOf(base, options, {}, NO_TRUST);
  const file = parse(sources.body);
  const optionFile = sources.modules.get('./p');
  const checker = scopeOf(file, sources.modules, sources.held);
  const declaration = optionFile === undefined
    ? undefined
    : collect(optionFile, ts.isVariableDeclaration)
        .find((candidate) => {
          return candidate.name.getText() === 'v';
        });
  const owner = declaration?.initializer;
  const landing = collect(file, ts.isIdentifier)
    .find((identifier) => {
      return identifier.text === 'v';
    });

  if (owner === undefined || landing === undefined) {
    throw new Error(`No v in ${base} or ./p`);
  }

  const moved = ts.isArrowFunction(owner) ? returnedOf(owner) : owner;
  const found: Landing = {
    checker,
    sources,
    owner,
    moved,
    landing,
  };

  return found;
};

const landingOf = (base: string, option: string): Landing => {
  return landingAmong(base, { './p': option });
};

const READ_V = 'import { v } from \'./p\';\n\nexport const y = v;\n';

describe('landedCheck', () => {
  it.each([
    ['a global nothing binds', 'export const v = location.pathname;\n'],
    ['an import of the option', 'import { join } from \'node:path\';\n\nexport const v = join;\n'],
    ['an export the base binds', 'export const a = 1;\nexport const v = a + 1;\n'],
    ['a binding of the moved code', 'export const v = (n: number) => n;\n'],
    ['a parameter of the arrow it returns from', 'export const v = (n: number) => n * 2;\n'],
    ['a variable of the build', 'export const v = import.meta.env.DEV;\n'],
    ['a member of a variable of the build', 'export const v = () => import.meta.env.BASE_URL.length;\n'],
    ['a variable of the build spread', 'export const v = () => f(...import.meta.env.LIST);\n'],
    ['a variable of the build negated', 'export const v = () => -import.meta.env.N;\n'],
    ['a variable of the build as a default', 'export const v = () => ({ b = import.meta.env.DEV } = {});\n'],
  ])('lets option code land that reads %s', (_name, option) => {
    const base = 'import { a, v } from \'./p\';\n\nexport const y = [a, v];\n';
    const {
      checker,
      sources,
      owner,
      moved,
      landing,
    } = landingOf(base, option);

    const run = (): void => {
      landedCheck(checker, sources, owner, moved, landing);
    };

    expect(run).not.toThrow();
  });

  it.each([
    'import.meta',
    'import.meta.url',
    'import.meta.env',
    'import.meta.env[name]',
    'import.meta.env?.DEV',
    'import.meta?.env.DEV',
    'import.meta[\'env\'].DEV',
    'import.meta.url.env',
    'import.meta.hot.env.DEV',
    '({ ...import.meta.env })',
    'import.meta.env.DEV = 1',
    'import.meta.env.DEV += 1',
    'import.meta.env.DEV ??= 1',
    'import.meta.env.DEV++',
    '--import.meta.env.DEV',
    '(import.meta.env.DEV)++',
    'import.meta.env.DEV! = 1',
    '((import.meta.env.DEV as T) = 1)',
    'delete import.meta.env.DEV',
    'delete (import.meta.env.DEV)',
    '[import.meta.env.DEV] = xs',
    '[...import.meta.env.DEV] = xs',
    '[import.meta.env.DEV = 1] = xs',
    '({ a: import.meta.env.DEV } = o)',
    '({ ...import.meta.env.DEV } = o)',
  ])('refuses option code that lands with %s, not a read of a build variable', (code) => {
    const {
      checker,
      sources,
      owner,
      moved,
      landing,
    } = landingOf(READ_V, `export const v = () => ${code};\n`);

    const run = (): void => {
      landedCheck(checker, sources, owner, moved, landing);
    };

    expect(run).toThrow('The option\'s code reads "import.meta", which names another thing where it lands: v');
  });

  it.each(['for (import.meta.env.DEV of xs) {}', 'for (import.meta.env.DEV in xs) {}'])('refuses %s', (loop) => {
    const {
      checker,
      sources,
      owner,
      moved,
      landing,
    } = landingOf(READ_V, `export const v = () => () => {\n  ${loop}\n};\n`);

    const run = (): void => {
      landedCheck(checker, sources, owner, moved, landing);
    };

    expect(run).toThrow('The option\'s code reads "import.meta", which names another thing where it lands: v');
  });

  it('refuses a private option helper named as another option\'s export the base binds', () => {
    const base = 'import { v } from \'./p\';\nimport { a } from \'./q\';\n\nexport const y = [a, v];\n';
    const options = {
      './p': 'const a = 2;\n\nexport const v = a;\n',
      './q': 'export const a = 1;\n',
    };
    const {
      checker,
      sources,
      owner,
      moved,
      landing,
    } = landingAmong(base, options);

    const run = (): void => {
      landedCheck(checker, sources, owner, moved, landing);
    };

    expect(run).toThrow('"a" is declared in an option module and read by code that left it behind: v');
  });

  it('refuses a private option helper that a base parameter of its name would capture (F6a)', () => {
    const base = 'import { v } from \'./p\';\n\nexport const f = (helper: number) => {\n  return v + helper;\n};\n';
    const option = 'const helper = 10;\nexport const v = helper * 2;\n';
    const {
      checker,
      sources,
      owner,
      moved,
      landing,
    } = landingOf(base, option);

    const run = (): void => {
      landedCheck(checker, sources, owner, moved, landing);
    };

    expect(run).toThrow('"helper" would read the base\'s own binding of that name where the option\'s code lands: v');
  });

  it('refuses a global that a base parameter of its name would capture (F6b)', () => {
    const base = [
      'import { v } from \'./p\';',
      '',
      'export const f = (location: string) => {',
      '  return v() + location;',
      '};',
      '',
    ].join('\n');
    const option = 'export const v = () => location.pathname;\n';
    const {
      checker,
      sources,
      owner,
      moved,
      landing,
    } = landingOf(base, option);

    const run = (): void => {
      landedCheck(checker, sources, owner, moved, landing);
    };

    expect(run).toThrow('"location" would read the base\'s own binding of that name where the option\'s code lands: v');
  });

  it.each([
    [
      'the top level, by another option\'s case',
      'export const y = v;\n',
      'other',
      '"helper" would read what another option\'s case declares, where the option\'s code lands: v',
    ],
    [
      'the top level, by a case of its own option',
      'export const y = v;\n',
      'own',
      '"helper" would read the base\'s own binding of that name where the option\'s code lands: v',
    ],
    [
      'the top level by another option\'s case, under a parameter of its name',
      'export const f = (helper: number) => v + helper;\n',
      'other',
      '"helper" would read the base\'s own binding of that name where the option\'s code lands: v',
    ],
    [
      'no case, at the top level',
      'export const y = v;\n',
      'none',
      '"helper" would read the base\'s own binding of that name where the option\'s code lands: v',
    ],
  ])('refuses a read of a name declared at %s', (_name, use, splicer, message) => {
    const base = `import { v } from './p';\n\nconst helper = 1;\n\n${use}`;
    const {
      checker,
      sources,
      owner,
      moved,
      landing,
    } = landingOf(base, 'export const v = helper;\n');
    const from = splicer === 'own' ? owner.getSourceFile() : parse('');

    if (splicer !== 'none') {
      sources.spliced.set('helper', from);
    }

    const run = (): void => {
      landedCheck(checker, sources, owner, moved, landing);
    };

    expect(run).toThrow(message);
  });

  it.each([
    [
      'import fs from \'node:fs\';\nimport { v } from \'./p\';\n\nexport const y = [fs, v];\n',
      'export const v = fs;\n',
      '"fs" is a global in the option module, and the base imports that name: v',
    ],
    [
      'import { v } from \'./p\';\n\nexport const y = v;\n',
      'const helper = 1;\n\nexport const v = helper;\n',
      '"helper" is declared in an option module and read by code that left it behind: v',
    ],
    [
      'import { v } from \'./p\';\n\nexport const y = v;\n',
      'export const v = () => this.size;\n',
      'The option\'s code reads "this", which names another thing where it lands: v',
    ],
    [
      'import { v } from \'./p\';\n\nexport const y = v;\n',
      'export const v = () => arguments[0];\n',
      'The option\'s code reads "arguments", which names another thing where it lands: v',
    ],
    [
      'import { v } from \'./p\';\n\nexport const y = v;\n',
      'export const v = () => super.size;\n',
      'The option\'s code reads "super", which names another thing where it lands: v',
    ],
    [
      'import { v } from \'./p\';\n\nexport const y = v;\n',
      'export const v = () => new.target;\n',
      'The option\'s code reads "new.target", which names another thing where it lands: v',
    ],
    [
      READ_V,
      'export const v = () => new.target.env.DEV;\n',
      'The option\'s code reads "new.target", which names another thing where it lands: v',
    ],
    [
      READ_V,
      'export const v = import.meta.url;\n',
      'The option\'s code reads "import.meta", which names another thing where it lands: v',
    ],
  ])('refuses option code landing in %j that reads what the base cannot give it', (base, option, message) => {
    const {
      checker,
      sources,
      owner,
      moved,
      landing,
    } = landingOf(base, option);

    const run = (): void => {
      landedCheck(checker, sources, owner, moved, landing);
    };

    expect(run).toThrow(message);
  });
});

describe('wellFormed', () => {
  it('answers a text that is a module', () => {
    const text = wellFormed('export const y = <a />;\n');

    expect(text).toBe('export const y = <a />;\n');
  });

  it('refuses a text that is no longer a module', () => {
    const run = (): string => {
      return wellFormed('export const y = ;\n');
    };

    expect(run).toThrow(/does not parse: Expression expected/u);
  });
});
