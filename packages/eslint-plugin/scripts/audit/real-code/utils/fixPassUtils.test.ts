import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  auditContext,
  captured,
  configOf,
  plantRules,
  textRule,
} from '@mocks/auditContext.ts';

import { runFixPass } from './fixPassUtils.ts';
import { AUDIT_RULES } from './reportShapeUtils.ts';

import type { Rule } from 'eslint';

const dir = mkdtempSync(join(tmpdir(), 'fix-pass-'));
const write = (name: string, text: string): string => {
  const file = join(dir, name);

  writeFileSync(file, text);

  return file;
};

const clean = write('clean.ts', 'type A = { first: string } | string;\n');
const script = write('script.js', 'const b = 1;\n');
const compiled = write('compiled.js', 'x;\n//# sourceMappingURL=x.map\n');
const broken = write('broken.ts', 'const = ;\n');
const copy = write('copy.ts', 'type A = { first: string } | string;\n');
const reported = write('reported.ts', '// REPORT\nconst c = 1;\nf();\nfunction f() {}\n');
const swapped = write('swapped.ts', '// SWAP\ntype B = "a" | "b";\n');
const dropped = write('dropped.ts', '// DROP\ntype C = "a" | "b";\n');
const throws = write('throws.ts', '// THROW\nconst d = 1;\n');

const swaps = textRule((text) => {
  return text.includes('SWAP') ? text.replace('|', '&') : text;
});
const unionNewline: Rule.RuleModule = {
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
const dropsComment = textRule((text) => {
  return text.replace('// DROP\n', '\n');
});

const reporter = (message: string): Rule.RuleModule => {
  return {
    create: (context) => {
      return {
        Program: (node) => {
          if (context.sourceCode
            .getText()
            .includes('REPORT')) {
            context.report({
              node,
              message,
            });
          }
        },
      };
    },
  };
};

const plantAudit = (context: ReturnType<typeof auditContext>): void => {
  const [typescript] = configOf({
    'prefer-await-to-then': reporter('not a promise call'),
    'prefer-arrow-functions': reporter('nothing to convert'),
  });

  context.configCache.set(`${AUDIT_RULES.join(',')}|{}`, [typescript ?? {}, {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',
    },
  }]);
};

describe('runFixPass', () => {
  it('passes a clean corpus and counts what it skipped', () => {
    const printed = captured();
    const context = auditContext({
      files: [
        clean,
        script,
        compiled,
        broken,
        copy,
      ],
      sources: [dir],
    });

    expect(runFixPass(context)).toBe(0);
    expect(printed()).toContain('5 files (3 TypeScript, 2 JavaScript) under:');
    expect(printed()).toContain('TypeScript: 1 files linted, 1 changed by a fixer, 0 findings\n  skipped: 0 compiled, '
      + '0 minified or bundled, 0 oversized, 1 duplicates, 1 the parser rejected');
    expect(printed()).toContain('JavaScript: 1 files linted, 0 changed by a fixer, 0 findings\n  skipped: 1 compiled');
    expect(printed()).toContain('every fix parsed, converged');

    const timedFiles = context.timings
      .map(({ file }) => {
        return file;
      });

    expect(timedFiles).toStrictEqual([clean, script]);
  });

  it('reports every finding, names the culprit, and tallies them', () => {
    const printed = captured();
    const context = auditContext({
      activeRules: ['union-newline', 'member-newline'],
      files: [
        script,
        reported,
        swapped,
        dropped,
        throws,
        ...Array.from({ length: 495 }, () => {
          return script;
        }),
      ],
      sources: [dir],
    });

    plantRules(context, {
      'union-newline': unionNewline,
      'member-newline': dropsComment,
    });
    plantAudit(context);

    const found = runFixPass(context);
    const output = printed();

    expect(found).toBe(context.findings.length);

    const summaries = context.findings
      .map(({
        category,
        file,
        rules,
      }) => {
        return `${category} ${file} ${rules.join(',')}`;
      });

    expect(summaries).toStrictEqual([
      `report shape ${reported} prefer-await-to-then`,
      `token loss ${swapped} union-newline`,
      `comment loss ${dropped} member-newline`,
      `comment moved ${dropped} member-newline`,
      `threw ${throws} union-newline,member-newline`,
    ]);
    expect(output).toContain(`[ERROR] report shape: ${reported}\n  rules: prefer-await-to-then\n  report at 2:0 is `
      + 'not the shape the rule claims\n  reported at line 2:\n    // REPORT\n    const c = 1;');
    expect(output).toContain(`[ERROR] threw: ${throws}`);
    expect(output).toContain('[INFO] 500/500 files, 2 fixed, 5 findings');
    expect(output).toContain('reports across the corpus:\n        1  @linteljs/prefer-await-to-then\n'
      + '        1  @linteljs/prefer-arrow-functions');
    expect(output).toContain(`busiest files:\n        2  ${reported}`);
    expect(output).toContain('[ERROR] 5 findings\n  1  report shape');
    expect(output).toContain('by rule:\n  2  member-newline');
  });
});
