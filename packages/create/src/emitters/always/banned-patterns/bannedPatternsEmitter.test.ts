import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Data,
  DEFAULT_ANSWERS,
  type Router,
  type Styling,
  type TargetId,
  type Testing,
  type TypeSafety,
} from '@answers';
import { TEMPLATES_ROOT } from '@disk';

import {
  bannedPatternsEmitter,
  checkerArtifact,
  setupTestsPath,
} from './bannedPatternsEmitter';

interface AnswerOverrides {
  target?: TargetId;
  typeSafety?: TypeSafety;
  router?: Router;
  testing?: Testing;
  styling?: Styling;
  data?: Data;
}

// The file the artifact copies from, read the way `shippedAssetsReader` reads it.
const SHIPPED = join(TEMPLATES_ROOT, 'project/scripts/checkBannedPatterns.ts');

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

const transformOf = (answers: Answers): ((source: string, current: string | null) => string) => {
  const { content } = checkerArtifact(answers);

  if (!('sources' in content) || content.transform === undefined) {
    throw new Error('the checker artifact must carry a transform');
  }

  return content.transform;
};

// Guards against anchor drift: a silent miss would ship the wrong floor.
describe('bannedPatternsEmitter', () => {
  it('writes the checker and nothing else', () => {
    expect(bannedPatternsEmitter(answersFor({})).map(({ target }) => {
      return target;
    })).toEqual(['scripts/checkBannedPatterns.ts']);
  });
});

describe('setupTestsPath', () => {
  // Read off `jsx`, since Solid and Vue set `preserve` and render without a React transform.
  it.each<[TargetId, string]>([
    ['react', '__mocks__/setupTests.tsx'],
    ['next', '__mocks__/setupTests.tsx'],
    ['vue', '__mocks__/setupTests.ts'],
    ['solid', '__mocks__/setupTests.ts'],
  ])('names the %s setup file %s', (target, path) => {
    expect(setupTestsPath(answersFor({ target }))).toBe(path);
  });

  // A project that already holds the other spelling keeps it rather than gaining a second setup file.
  it('keeps the spelling a project already holds', () => {
    expect(setupTestsPath(answersFor({ target: 'react' }), ['__mocks__/setupTests.ts']))
      .toBe('__mocks__/setupTests.ts');
  });
});

describe('checkerArtifact', () => {
  it.each<TypeSafety>(['strict', 'relaxed'])('writes the %s floor into the shipped checker', (typeSafety) => {
    expect(transformOf(answersFor({ typeSafety }))(readFileSync(SHIPPED, 'utf8'), null))
      .toContain(`const TYPE_SAFETY: TypeSafety = '${typeSafety}';`);
  });

  it('throws when the type-safety anchor has drifted out of the shipped checker', () => {
    expect(() => {
      return transformOf(answersFor({ typeSafety: 'relaxed' }))('// a checker with no anchor\n', null);
    }).toThrow("no longer contains the anchor: const TYPE_SAFETY: TypeSafety = 'strict';");
  });

  // `.astro` stays out: the checker reads script and SFC files only.
  it.each<[TargetId, string]>([
    ['react', "['.ts', '.tsx']"],
    ['astro', "['.ts', '.tsx']"],
    ['vue', "['.ts', '.tsx', '.vue']"],
    ['svelte', "['.ts', '.tsx', '.svelte']"],
  ])('writes the extensions a directory is scanned for on %s', (target, extensions) => {
    expect(transformOf(answersFor({ target }))(readFileSync(SHIPPED, 'utf8'), null))
      .toContain(`const SCANNED_EXTENSIONS: string[] = ${extensions};`);
  });

  it('throws when the extension anchor has drifted out of the shipped checker', () => {
    expect(() => {
      return transformOf(answersFor({}))("const TYPE_SAFETY: TypeSafety = 'strict';\n", null);
    }).toThrow('no longer contains the anchor');
  });

  it('leaves the strict floor untouched for a target with nothing to exempt', () => {
    const source = "const TYPE_SAFETY: TypeSafety = 'strict';\n"
      + "const SCANNED_EXTENSIONS: string[] = ['.ts', '.tsx'];\nconst PROJECT_SKIPPED: string[] = [];\n";

    expect(transformOf(answersFor({}))(source, null)).toBe(source);
  });
});

// The file holds the standard's patterns and the project's exemptions. `preserve: true` froze both; emitting would
// delete the project's half.
describe('the checker merge', () => {
  const shippedFor = (answers: Answers): string => {
    return transformOf(answers)(readFileSync(SHIPPED, 'utf8'), null);
  };

  const ENTRY = "  'src/lib/protocol/protocol.ts',";

  // A project's file as it really reads, closing on a line of its own. By function, so a `$&` in a fixture survives.
  const skippingWith = (answers: Answers, ...lines: string[]): string => {
    return shippedFor(answers).replace('const PROJECT_SKIPPED: string[] = [];', () => {
      return ['const PROJECT_SKIPPED: string[] = [', ...lines, '];'].join('\n');
    });
  };

  it("keeps a project's exemptions while taking the standard's patterns", () => {
    const answers = answersFor({});
    const project = skippingWith(answers, '  // the wire vocabulary, argued in type-standards.md', ENTRY);

    const merged = transformOf(answers)(readFileSync(SHIPPED, 'utf8'), project);

    expect(merged).toContain(ENTRY);
    expect(merged).toContain('the wire vocabulary, argued in type-standards.md');
    // And the standard's own half is the shipped one, not whatever the project froze.
    expect(merged).toContain('CAUGHT_VALUE');
  });
});
