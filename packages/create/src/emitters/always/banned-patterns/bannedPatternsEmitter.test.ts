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
} from '#answers';
import { TEMPLATES_ROOT } from '#disk';

import { checkerArtifact } from './bannedPatternsEmitter';

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
describe('checkerArtifact', () => {
  it.each<TypeSafety>(['strict', 'relaxed'])('writes the %s floor into the shipped checker', (typeSafety) => {
    expect(transformOf(answersFor({ typeSafety }))(readFileSync(SHIPPED, 'utf8'), null))
      .toContain(`const TYPE_SAFETY: TypeSafety = '${typeSafety}';`);
  });

  it('throws when the type-safety anchor has drifted out of the shipped checker', () => {
    expect(() => {
      return transformOf(answersFor({ typeSafety: 'relaxed' }))('// a checker with no anchor\n', null);
    }).toThrow('no longer contains the anchor');
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

  it('takes the shipped blocks whole on a first write', () => {
    expect(shippedFor(answersFor({}))).toContain('const PROJECT_SKIPPED');
  });

  // `String.replace` reads `$&` and `$'` in a string replacement as the match and the text after it.
  it("carries a project's block verbatim when its text reads as a replacement pattern", () => {
    const answers = answersFor({});
    const note = "  // $& and $' below are literal, not the match and its tail";

    const merged = transformOf(answers)(readFileSync(SHIPPED, 'utf8'), skippingWith(answers, note, ENTRY));

    expect(merged).toContain(note);
  });

  // A reason quoting code carries `];` as a substring, which ended the block mid-comment and left its array open.
  it("carries a project's block whole when a reason inside it quotes code", () => {
    const answers = answersFor({});
    const reason = '  // every read is guarded, never a bare arr[0]; see type-standards.md';

    const merged = transformOf(answers)(readFileSync(SHIPPED, 'utf8'), skippingWith(answers, reason, ENTRY));

    expect(merged).toContain(ENTRY);
    expect(merged).toContain(reason);
  });
});

/**
 * The three ways the carry-over declines and leaves the shipped text: a project whose file no longer declares the
 * block at all, and either side left unterminated by an edit that broke it.
 */
describe('the checker merge when a block cannot be found', () => {
  it('takes the shipped block when the project no longer declares one', () => {
    const shipped = readFileSync(SHIPPED, 'utf8');
    const merged = transformOf(answersFor({}))(shipped, '// a checker with no project blocks\n');

    expect(merged).toContain('const PROJECT_SKIPPED');
    expect(merged).toContain('const PROJECT_BANNED');
  });

  it('takes the shipped block when the project left one unterminated', () => {
    const shipped = readFileSync(SHIPPED, 'utf8');
    const broken = 'const PROJECT_BANNED: BannedPattern[] = [\n  { name: "ours" },\n';
    const merged = transformOf(answersFor({}))(shipped, broken);

    expect(merged).toContain('const PROJECT_BANNED: BannedPattern[] = [];');
  });
});
