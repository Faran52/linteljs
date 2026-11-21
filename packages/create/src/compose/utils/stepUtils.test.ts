import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Sources, sourcesOf } from './bindingUtils';
import { returnedOf } from './callUtils';
import { scopeOf } from './scopeUtils';
import { collect, parse } from './sourceUtils';
import {
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

const BASE = 'import fs, * as all from \'node:fs\';\nimport { join } from \'node:path\';\nimport { x } from \'./p\';\n';
const OPTION = 'const helper = 1;\n\nexport const x = helper;\nexport interface Local {}\n';

const sourcesFor = (): Sources => {
  return sourcesOf(BASE, { './p': OPTION });
};

describe('settled', () => {
  it('applies a rewrite until it has nothing left to do', () => {
    const text = settled('aaa', (current) => {
      return current.includes('a') ? current.replace('a', 'b') : undefined;
    });

    expect(text).toBe('bbb');
  });

  it('refuses a rewrite that never stops', () => {
    const run = (): string => {
      return settled('a', (text) => {
        return `${text}a`.slice(-1);
      });
    };

    expect(run).toThrow(/did not settle/u);
  });
});

describe('checked', () => {
  it.each([
    ['export const y = 1;\n'],
    ['export const y = { x: 1, helper: 2 };\n'],
    ['const helper = 2;\n\nexport const y = helper;\n'],
    ['interface Local {}\n\nexport type Y = Local;\n'],
    ['export const y = [fs, all, join];\n'],
  ])('answers the parsed module for %j', (text) => {
    const sources = sourcesFor();
    const file = checked(text, sources);

    expect(file.text).toBe(text);
  });

  it('refuses a parameter binding that is still read', () => {
    const run = (): ts.SourceFile => {
      const sources = sourcesFor();

      return checked('export const y = x;\n', sources);
    };

    expect(run).toThrow(/is left after composing: x/u);
  });

  it('refuses a directive that is still written', () => {
    const run = (): ts.SourceFile => {
      const sources = sourcesFor();

      return checked('export const y = 1; // @lintel:comment ./p#note\n', sources);
    };

    expect(run).toThrow(/is left after composing: @lintel:/u);
  });

  it('answers a base binding that shadows a parameter binding, which reads what its author meant', () => {
    const sources = sourcesFor();
    const file = checked('export const y = (x: number) => x;\n', sources);

    expect(file.statements).toHaveLength(1);
  });
});

// The option's `v` lands on the first read of `v` in the base: its value, or what its arrow returns.
const landingOf = (base: string, option: string): Landing => {
  const sources = sourcesOf(base, { './p': option });
  const file = parse(sources.body);
  const optionFile = sources.modules.get('./p');
  const checker = scopeOf(file, sources.modules);
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
    throw new Error(`No v in ${base} or ${option}`);
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

describe('landedCheck', () => {
  it.each([
    ['a global nothing binds', 'export const v = location.pathname;\n'],
    ['an import of the option', 'import { join } from \'node:path\';\n\nexport const v = join;\n'],
    ['an export the base binds', 'export const a = 1;\nexport const v = a + 1;\n'],
    ['a binding of the moved code', 'export const v = (n: number) => n;\n'],
    ['a parameter of the arrow it returns from', 'export const v = (n: number) => n * 2;\n'],
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
      'import { v } from \'./p\';\n\nexport const y = v;\n',
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
