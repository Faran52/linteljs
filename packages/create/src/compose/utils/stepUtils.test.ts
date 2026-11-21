import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Sources, sourcesOf } from './bindingUtils';
import {
  checked,
  settled,
  wellFormed,
} from './stepUtils';

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

  it.each([
    ['export const y = helper;\n', '"helper" is declared in an option module and read by code that left it behind.'],
    ['export const y: Local = 1;\n', '"Local" is declared in an option module and read by code that left it behind.'],
    ['export const y = (join: string) => join;\n', '"join" is imported and also bound in the composed body'],
    ['const fs = 1;\n\nexport const y = fs;\n', '"fs" is imported and also bound in the composed body'],
    ['const all = 1;\n\nexport const y = all;\n', '"all" is imported and also bound in the composed body'],
  ])('refuses %j, whose names no longer mean what their author meant', (text, message) => {
    const run = (): ts.SourceFile => {
      const sources = sourcesFor();

      return checked(text, sources);
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
