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
    const modernSourceCode = sourceCodeOf(modern);
    expect(modernSourceCode).toBe(sourceCode);
  });

  it('falls back to the method where it does not', () => {
    const legacySourceCode = sourceCodeOf(legacy);
    expect(legacySourceCode).toBe(sourceCode);
  });

  it('throws rather than reporting nothing when neither is there', () => {
    expect(() => {
      return sourceCodeOf({});
    }).toThrow('needs a SourceCode');
  });
});

describe('physicalFilenameOf', () => {
  it('prefers the physical path over the reported one', () => {
    const physicalFilename = physicalFilenameOf(modern);
    expect(physicalFilename).toBe('/repo/src/App.tsx');
    const legacyPhysicalFilename = physicalFilenameOf(legacy);
    expect(legacyPhysicalFilename).toBe('/repo/src/App.tsx');
  });

  it('falls back to the reported filename, in both spellings', () => {
    const fromProperty = physicalFilenameOf({ filename: '/repo/src/a.ts' });
    expect(fromProperty).toBe('/repo/src/a.ts');

    const fromGetter = physicalFilenameOf({
      getFilename: () => {
        return '/repo/src/b.ts';
      },
    });
    expect(fromGetter).toBe('/repo/src/b.ts');
  });

  it('throws when the major offers no filename at all', () => {
    expect(() => {
      return physicalFilenameOf({});
    }).toThrow('needs a filename');
  });
});

describe('the scope readers', () => {
  it('answer from the node-taking readers on a modern major', () => {
    const scope = scopeOf(modern, node);
    expect(scope).toBe(sourceCode.getScope(node));
    const ancestors = ancestorsOf(modern, node);
    expect(ancestors).toEqual(sourceCode.getAncestors(node));
    const declaredVariables = declaredVariablesOf(modern, node);
    expect(declaredVariables).toEqual(sourceCode.getDeclaredVariables(node));
  });

  it('fall back to the context-level readers when the SourceCode has none', () => {
    const none: CompatSourceCode = {};

    const scope = scopeIn(none, legacy, node);
    expect(scope).toBe(sourceCode.getScope(node));
    const ancestors = ancestorsIn(none, legacy, node);
    expect(ancestors).toEqual(sourceCode.getAncestors(node));

    const declaredVariables = declaredVariablesIn(none, legacy, node);

    expect(declaredVariables)
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
    const ancestors = ancestorReaderOf(modern).getAncestors(node);

    expect(ancestors)
      .toEqual(sourceCode.getAncestors(node));

    const nodeAncestors = ancestorReaderOf(legacy).getAncestors(node);

    expect(nodeAncestors)
      .toEqual(sourceCode.getAncestors(node));
  });
});
