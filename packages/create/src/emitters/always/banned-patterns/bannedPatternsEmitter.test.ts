import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { TEMPLATES_ROOT } from '@disk';

import { bannedPatternsEmitter, checkerArtifact } from './bannedPatternsEmitter';

import type {
  Answers,
  TargetId,
  TypeSafety,
} from '@config/types';

const SHIPPED = join(TEMPLATES_ROOT, 'project/scripts/checkBannedPatterns.ts');

const transformOf = (answers: Answers): ((source: string, current: string | null) => string) => {
  const { content } = checkerArtifact(answers);

  if (!('sources' in content) || content.transform === undefined) {
    throw new Error('the checker artifact must carry a transform');
  }

  return content.transform;
};

describe('bannedPatternsEmitter', () => {
  it('writes the checker and nothing else', () => {
    const artifacts = bannedPatternsEmitter(answersFor({}));
    const targets = artifacts
      .map(({ target }) => {
        return target;
      });

    const expected = ['scripts/checkBannedPatterns.ts'];
    expect(targets).toEqual(expected);
  });
});

describe('checkerArtifact', () => {
  it.each<TypeSafety>(['strict', 'relaxed'])('writes the %s floor into the shipped checker', (typeSafety) => {
    const transform = transformOf(answersFor({ typeSafety }));
    const shipped = readFileSync(SHIPPED, 'utf8');
    const actual = transform(shipped, null);

    expect(actual)
      .toContain(`const TYPE_SAFETY: TypeSafety = '${typeSafety}';`);
  });

  it('throws when the type-safety anchor has drifted out of the shipped checker', () => {
    expect(() => {
      const transform = transformOf(answersFor({ typeSafety: 'relaxed' }));

      return transform('// a checker with no anchor\n', null);
    }).toThrow("no longer contains the anchor: const TYPE_SAFETY: TypeSafety = 'strict';");
  });

  it.each<[TargetId, string]>([
    ['react', "['.ts', '.tsx']"],
    ['astro', "['.ts', '.tsx']"],
    ['vue', "[\n  '.ts',\n  '.tsx',\n  '.vue',\n]"],
    ['svelte', "[\n  '.ts',\n  '.tsx',\n  '.svelte',\n]"],
  ])('writes the extensions a directory is scanned for on %s', (target, extensions) => {
    const transform = transformOf(answersFor({ target }));
    const shipped = readFileSync(SHIPPED, 'utf8');
    const actual = transform(shipped, null);

    expect(actual)
      .toContain(`const SCANNED_EXTENSIONS: string[] = ${extensions};`);
  });

  it('throws when the extension anchor has drifted out of the shipped checker', () => {
    expect(() => {
      const transform = transformOf(answersFor({}));

      return transform("const TYPE_SAFETY: TypeSafety = 'strict';\n", null);
    }).toThrow('no longer contains the anchor');
  });

  it('leaves the strict floor untouched for a target with nothing to exempt', () => {
    const source = "const TYPE_SAFETY: TypeSafety = 'strict';\n"
      + "const SCANNED_EXTENSIONS: string[] = ['.ts', '.tsx'];\nconst PROJECT_SKIPPED: string[] = [];\n";

    const transform = transformOf(answersFor({}));
    const actual = transform(source, null);
    expect(actual).toBe(source);
  });
});

describe('the checker merge', () => {
  const shippedFor = (answers: Answers): string => {
    const transform = transformOf(answers);
    const shipped = readFileSync(SHIPPED, 'utf8');

    return transform(shipped, null);
  };

  const ENTRY = "  'src/lib/protocol/protocol.ts',";

  const skippingWith = (answers: Answers, ...lines: string[]): string => {
    return shippedFor(answers)
      .replace('const PROJECT_SKIPPED: string[] = [];', () => {
        const block = [
          'const PROJECT_SKIPPED: string[] = [',
          ...lines,
          '];',
        ];

        return block.join('\n');
      });
  };

  it("keeps a project's exemptions while taking the standard's patterns", () => {
    const answers = answersFor({});
    const project = skippingWith(answers, '  // the wire vocabulary, argued in type-standards.md', ENTRY);

    const merged = transformOf(answers)(readFileSync(SHIPPED, 'utf8'), project);

    expect(merged).toContain(ENTRY);
    expect(merged).toContain('the wire vocabulary, argued in type-standards.md');
    expect(merged).toContain('CAUGHT_VALUE');
  });
});
