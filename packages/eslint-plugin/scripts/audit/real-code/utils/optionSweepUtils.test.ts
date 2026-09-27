import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  auditContext,
  captured,
  plantRules,
  textRule,
} from '@mocks/auditContext.ts';

import { configurationsFor } from '../../utils/optionUtils.ts';

import { runOptionSweep } from './optionSweepUtils.ts';

import type { Rule } from 'eslint';

const dir = mkdtempSync(join(tmpdir(), 'option-sweep-'));
const write = (name: string, text: string): string => {
  const file = join(dir, name);

  writeFileSync(file, text);

  return file;
};

const clean = write('clean.ts', 'type A = Record<"a" | "b" | "c" | "d", string>;\n');
const marked = write('marked.ts', '// SWAP\ntype B = "a" | "b";\n');
const throws = write('throws.ts', '// THROW\nconst c = 1;\n');
const compiled = write('compiled.js', 'x;\n//# sourceMappingURL=x.map\n');

const swaps = textRule((text) => {
  return text.includes('SWAP') ? text.replace('|', '&') : text;
});

// Breaks only the files carrying its markers, so every other file under the same configuration stays clean.
const defective: Rule.RuleModule = {
  ...swaps,
  create: (context) => {
    if (context.sourceCode
      .getText()
      .includes('THROW')) {
      throw new Error('rule crashed');
    }

    return swaps.create(context);
  },
};

describe('runOptionSweep', () => {
  it('warns and answers no findings when no rule in the run takes an option', () => {
    const printed = captured();

    const sweep = runOptionSweep(auditContext({
      activeRules: ['comment-delimiter'],
      files: [clean],
    }));

    expect(sweep).toBe(0);
    expect(printed()).toContain('nothing to sweep');
  });

  it('counts every configuration and passes a clean corpus', () => {
    const printed = captured();
    const context = auditContext({ files: [clean, compiled] });

    expect(runOptionSweep(context)).toBe(0);

    expect(printed()).toContain('2 files sampled, against 3 configurations read off meta.schema:');
    expect(printed()).toContain('     1      1    0  union-newline { maxGenericMembers: 1 }');
    expect(printed()).toContain('     1      0    0  union-newline { maxGenericMembers: 8 }');
    expect(printed()).toContain('under every configuration');
    expect(context.options).toStrictEqual({});
  });

  it('reports a finding under the configuration that produced it, and a crash, and counts progress', () => {
    const printed = captured();
    const context = auditContext({
      // The duplicates cost nothing to skip and carry the run past the 250-file progress line.
      files: [marked, throws, ...Array.from({ length: 248 }, () => {
        return clean;
      })],
    });

    for (const { options } of configurationsFor('union-newline')) {
      plantRules(context, { 'union-newline': defective }, options);
    }

    expect(runOptionSweep(context)).toBe(4);

    expect(printed()).toContain('[ERROR] under union-newline { maxGenericMembers: 1 }');
    expect(printed()).toContain(`[ERROR] token loss: ${marked}`);
    expect(printed()).toContain(`[ERROR] threw: ${throws}\n  Error while loading rule '@linteljs/union-newline': `
      + 'rule crashed');
    expect(printed()).toContain('[INFO] 250/250 files, 4 findings');
    expect(printed()).toContain('[ERROR] 4 findings');
  });
});
