import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  ancestorReaderOf,
  ancestorsIn,
  ancestorsOf,
  type CompatContext,
  type CompatSourceCode,
  declaredVariablesIn,
  declaredVariablesOf,
  physicalFilenameOf,
  scopeIn,
  scopeOf,
  sourceCodeOf,
} from './compatUtils.ts';

const { sourceCode, firstNode } = sourceCodeFrom('const value = 1;\n');
const node = firstNode('VariableDeclarator');

const modern: CompatContext = {
  sourceCode,
  physicalFilename: '/repo/src/App.tsx',
};

const legacy: CompatContext = {
  getSourceCode: () => {
    return sourceCode;
  },
  getPhysicalFilename: () => {
    return '/repo/src/App.tsx';
  },
  getScope: () => {
    return sourceCode.getScope(node);
  },
  getAncestors: () => {
    return sourceCode.getAncestors(node);
  },
  getDeclaredVariables: (target) => {
    return sourceCode.getDeclaredVariables(target);
  },
};

describe('sourceCodeOf', () => {
  it('reads the property where the major has one', () => {
    expect(sourceCodeOf(modern)).toBe(sourceCode);
  });

  it('falls back to the method where it does not', () => {
    expect(sourceCodeOf(legacy)).toBe(sourceCode);
  });

  it('throws rather than reporting nothing when neither is there', () => {
    expect(() => {
      return sourceCodeOf({});
    }).toThrow('needs a SourceCode');
  });
});

describe('physicalFilenameOf', () => {
  it('prefers the physical path over the reported one', () => {
    expect(physicalFilenameOf(modern)).toBe('/repo/src/App.tsx');
    expect(physicalFilenameOf(legacy)).toBe('/repo/src/App.tsx');
  });

  it('falls back to the reported filename, in both spellings', () => {
    expect(physicalFilenameOf({ filename: '/repo/src/a.ts' })).toBe('/repo/src/a.ts');
    expect(physicalFilenameOf({
      getFilename: () => {
        return '/repo/src/b.ts';
      },
    })).toBe('/repo/src/b.ts');
  });

  it('throws when the major offers no filename at all', () => {
    expect(() => {
      return physicalFilenameOf({});
    }).toThrow('needs a filename');
  });
});

describe('the scope readers', () => {
  it('answer from the node-taking readers on a modern major', () => {
    expect(scopeOf(modern, node)).toBe(sourceCode.getScope(node));
    expect(ancestorsOf(modern, node)).toEqual(sourceCode.getAncestors(node));
    expect(declaredVariablesOf(modern, node)).toEqual(sourceCode.getDeclaredVariables(node));
  });

  it('fall back to the context-level readers when the SourceCode has none', () => {
    const none: CompatSourceCode = {};

    expect(scopeIn(none, legacy, node)).toBe(sourceCode.getScope(node));
    expect(ancestorsIn(none, legacy, node)).toEqual(sourceCode.getAncestors(node));
    expect(declaredVariablesIn(none, legacy, node))
      .toEqual(sourceCode.getDeclaredVariables(node));
  });

  it('throw where a major provides neither shape', () => {
    const none: CompatSourceCode = {};

    expect(() => {
      return scopeIn(none, {}, node);
    }).toThrow('needs a scope');
    expect(() => {
      return ancestorsIn(none, {}, node);
    }).toThrow('needs the ancestors');
    expect(() => {
      return declaredVariablesIn(none, {}, node);
    }).toThrow('needs the declared variables');
  });
});

describe('ancestorReaderOf', () => {
  it('hands the helpers one reader whichever major is underneath', () => {
    expect(ancestorReaderOf(modern).getAncestors(node))
      .toEqual(sourceCode.getAncestors(node));
    expect(ancestorReaderOf(legacy).getAncestors(node))
      .toEqual(sourceCode.getAncestors(node));
  });
});
