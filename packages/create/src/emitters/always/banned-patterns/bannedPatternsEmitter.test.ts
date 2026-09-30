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
    const targets = bannedPatternsEmitter(answersFor({}))
      .map(({ target }) => {
        return target;
      });

    expect(targets).toEqual(['scripts/checkBannedPatterns.ts']);
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

describe('the checker merge', () => {
  const shippedFor = (answers: Answers): string => {
    return transformOf(answers)(readFileSync(SHIPPED, 'utf8'), null);
  };

  const ENTRY = "  'src/lib/protocol/protocol.ts',";

  const skippingWith = (answers: Answers, ...lines: string[]): string => {
    return shippedFor(answers)
      .replace('const PROJECT_SKIPPED: string[] = [];', () => {
        return [
          'const PROJECT_SKIPPED: string[] = [',
          ...lines,
          '];',
        ].join('\n');
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
