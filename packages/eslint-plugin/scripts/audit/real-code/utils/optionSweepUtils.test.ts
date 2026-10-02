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
    const actual = printed();
    expect(actual).toContain('nothing to sweep');
  });

  it('counts every configuration and passes a clean corpus', () => {
    const printed = captured();
    const context = auditContext({ files: [clean, compiled] });

    const optionSweepResult = runOptionSweep(context);
    expect(optionSweepResult).toBe(0);

    const actual = printed();
    expect(actual).toContain('2 files sampled, against 3 configurations read off meta.schema:');
    const actual2 = printed();
    expect(actual2).toContain('     1      1    0  union-newline { maxGenericMembers: 1 }');
    const actual3 = printed();
    expect(actual3).toContain('     1      0    0  union-newline { maxGenericMembers: 8 }');
    const actual4 = printed();
    expect(actual4).toContain('under every configuration');
    expect(context.options).toStrictEqual({});
  });

  it('reports a finding under the configuration that produced it, and a crash, and counts progress', () => {
    const printed = captured();
    const context = auditContext({
      files: [
        marked,
        throws,
        ...Array.from({ length: 248 }, () => {
          return clean;
        }),
      ],
    });

    for (const { options } of configurationsFor('union-newline')) {
      plantRules(context, { 'union-newline': defective }, options);
    }

    const optionSweepResult = runOptionSweep(context);
    expect(optionSweepResult).toBe(4);

    const actual = printed();
    expect(actual).toContain('[ERROR] under union-newline { maxGenericMembers: 1 }');
    const actual2 = printed();
    expect(actual2).toContain(`[ERROR] token loss: ${marked}`);

    const actual3 = printed();

    expect(actual3).toContain(`[ERROR] threw: ${throws}\n  Error while loading rule '@linteljs/union-newline': `
      + 'rule crashed');

    const actual4 = printed();
    expect(actual4).toContain('[INFO] 250/250 files, 4 findings');
    const actual5 = printed();
    expect(actual5).toContain('[ERROR] 4 findings');
  });
});
