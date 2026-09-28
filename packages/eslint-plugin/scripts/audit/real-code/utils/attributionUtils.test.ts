import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  auditContext,
  plantRules,
  textRule,
} from '@mocks/auditContext.ts';

import { parse } from '../../utils/astUtils.ts';

import {
  attribute,
  dominantRule,
  evaluate,
  narrow,
} from './attributionUtils.ts';

import type { Rule } from 'eslint';
import type { AuditContext } from '../types.ts';

const UNION = 'type A = "a" | "b";\n';

const swapsPipe = textRule((text) => {
  return text.replace('|', '&');
});

const planted = (modules: Record<string, Rule.RuleModule>): AuditContext => {
  const context = auditContext();

  plantRules(context, modules);

  return context;
};

const categoriesOf = (context: AuditContext, source: string, names: string[]): string[] => {
  return evaluate(context, source, 'file.ts', names).findings
    .map(({ category }) => {
      return category;
    });
};

describe('evaluate', () => {
  it('reports nothing for a source that does not parse or a fix that changes nothing', () => {
    const context = auditContext();

    expect(evaluate(context, 'type = ;\n', 'file.ts', ['union-newline'])).toStrictEqual({
      changed: false,
      findings: [],
      fixed: 'type = ;\n',
    });
    expect(evaluate(context, UNION, 'file.ts', ['union-newline'], parse(UNION, 'file.ts')).changed).toBe(false);
  });

  it('passes a clean fix', () => {
    const result = evaluate(auditContext(), 'type A = { first: string } | string;\n', 'file.ts', ['union-newline']);

    expect(result.changed).toBe(true);
    expect(result.findings).toStrictEqual([]);
  });

  it('names the whitespace fixer that changed a token', () => {
    expect(evaluate(planted({ 'union-newline': swapsPipe }), UNION, 'file.ts', ['union-newline']).findings)
      .toStrictEqual([{
        category: 'token loss',
        rules: ['union-newline'],
        detail: 'token 4 was Punctuator "|" and is now Punctuator "&"',
      }]);
  });

  it('falls back to the fixers allowed to move members when no whitespace fixer is at fault', () => {
    const context = planted({
      'interface-order': swapsPipe,
      'union-newline': textRule(String),
    });

    expect(evaluate(context, UNION, 'file.ts', ['union-newline', 'interface-order']).findings).toStrictEqual([{
      category: 'token loss',
      rules: ['interface-order'],
      detail: 'token Punctuator "|" appears 1 time(s) in the input and 0 in the output',
    }]);
  });

  it('drops a token change no fixer promised to avoid', () => {
    expect(categoriesOf(planted({ 'comment-delimiter': swapsPipe }), UNION, ['comment-delimiter'])).toStrictEqual([]);
  });

  it('names the whole subset when only the fixers together change a token', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return text.replace('x =', 'x\n=');
      }),
      'member-newline': textRule((text) => {
        return text.replace('x\n', 'y\n');
      }),
    });

    expect(evaluate(context, 'let x = 1;\n', 'file.ts', ['union-newline', 'member-newline']).findings)
      .toStrictEqual([{
        category: 'token loss',
        rules: ['member-newline', 'union-newline'],
        detail: 'token 1 was Identifier "x" and is now Identifier "y"',
      }]);
  });

  it('reports output that does not parse with the parser message', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return text.replace('|', '');
      }),
    });

    expect(evaluate(context, UNION, 'file.ts', ['union-newline']).findings).toStrictEqual([{
      category: 'unparseable',
      rules: ['union-newline'],
      detail: '\';\' expected.',
    }]);
  });

  it('reports a fix that a second pass changes again', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return `${text} `;
      }),
    });

    expect(categoriesOf(context, UNION, ['union-newline'])).toStrictEqual(['non-convergent']);
  });

  it('reports a lost comment line, which has also left its anchor', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return text.replace('// note', '');
      }),
    });

    expect(categoriesOf(context, `${UNION}// note\n`, ['union-newline']))
      .toStrictEqual(['comment loss', 'comment moved']);
  });

  it('names the whitespace fixer that moved a comment onto other code', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return text.replace('1; // about a\n', '1;\n// about a\n');
      }),
      'member-newline': textRule(String),
    });
    const source = 'const a = 1; // about a\nconst b = 2;\n';

    expect(evaluate(context, source, 'file.ts', ['union-newline', 'member-newline']).findings)
      .toStrictEqual([{
        category: 'comment moved',
        rules: ['union-newline'],
        detail: 'comment " about a" written after Identifier "a" appears 1 time(s) in the input and 0 in the output',
      }]);
  });

  it('asks no other fixer about a moved comment, and names the whole subset when only both move it', () => {
    const moves = textRule((text) => {
      return text.replace('1;  // about a\n', '1;\n// about a\n');
    });
    const source = 'const a = 1; // about a\nconst b = 2;\n';
    const widens = textRule((text) => {
      return text.replace('1; //', '1;  //');
    });

    const categories = categoriesOf(planted({ 'prefer-arrow-functions': moves }), source.replace('1; ', '1;  '),
      ['prefer-arrow-functions']);

    expect(categories).toStrictEqual([]);

    const ruleSets = evaluate(planted({
      'union-newline': widens,
      'member-newline': moves,
    }), source, 'file.ts', ['union-newline', 'member-newline']).findings
      .map(({ rules }) => {
        return rules;
      });

    expect(ruleSets).toStrictEqual([['member-newline', 'union-newline']]);
  });

  it('reports a CRLF file gaining a bare line ending', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return text.replaceAll('\r\n', '\n');
      }),
    });

    expect(categoriesOf(context, 'const a = 1;\r\nconst b = 2;\r\n', ['union-newline']))
      .toStrictEqual(['line-ending change']);
  });

  it('lets an LF file with one stray CRLF line lose it', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return text.replaceAll('\r\n', '\n');
      }),
    });

    expect(categoriesOf(context, 'const a = 1;\r\nconst b = 2;\nconst c = 3;\n', ['union-newline']))
      .toStrictEqual([]);
  });

  it('reports an LF file with one stray CRLF line gaining more', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return text.replace('2;\n', '2;\r\n');
      }),
    });

    expect(categoriesOf(context, 'const a = 1;\r\nconst b = 2;\nconst c = 3;\n', ['union-newline']))
      .toStrictEqual(['line-ending change']);
  });
});

describe('narrow', () => {
  const lines = Array.from({ length: 60 }, (_, index) => {
    return `const v${String(index)} = ${String(index)};`;
  });

  it('answers the smallest slice that still shows the finding', () => {
    const source = [...lines.slice(0, 30), UNION.trimEnd(), ...lines.slice(30)].join('\n');
    const context = planted({ 'union-newline': swapsPipe });
    const { fixed, findings: [finding] } = evaluate(context, source, 'file.ts', ['union-newline']);

    expect(finding).toBeDefined();

    const narrowed = narrow(context, source, fixed, 'file.ts', finding ?? {
      category: '',
      detail: '',
      rules: [],
    });

    expect(narrowed).toStrictEqual([UNION, 'minimal reproduction']);
  });

  it('answers the changed hunk when no slice reproduces it', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return text.includes('MARK') ? text.replace('|', '&') : text;
      }),
    });
    const source = ['// MARK', ...lines, UNION.trimEnd()].join('\n');
    const { fixed, findings: [finding] } = evaluate(context, source, 'file.ts', ['union-newline']);
    const [hunk, label] = narrow(context, source, fixed, 'file.ts', finding ?? {
      category: '',
      detail: '',
      rules: [],
    });

    expect(label).toBe('changed hunk, could not narrow');
    expect(hunk).toBe(`${[...lines.slice(-3), UNION.trimEnd()].join('\n')}\n`);
  });

  it('starts the slice past the end of a source the fix only appended to', () => {
    const context = planted({
      'union-newline': textRule((text) => {
        return `${text}|`;
      }),
    });

    const narrowed = narrow(context, UNION, `${UNION}|`, 'file.ts', {
      category: 'unparseable',
      detail: '',
      rules: ['union-newline'],
    });

    expect(narrowed).toStrictEqual(['\n', 'minimal reproduction']);
  });
});

describe('attribute', () => {
  it('keeps the rules that show the category alone', () => {
    const context = planted({
      'union-newline': swapsPipe,
      'member-newline': textRule(String),
    });

    expect(attribute(context, UNION, 'file.ts', ['union-newline', 'member-newline'], 'token loss'))
      .toStrictEqual(['union-newline']);
  });
});

describe('dominantRule', () => {
  it('names the rule that costs the most over an empty pass', () => {
    const slow: Rule.RuleModule = {
      create: () => {
        const until = performance.now() + 30;

        while (performance.now() < until) {
        }

        return {};
      },
    };
    const file = join(mkdtempSync(join(tmpdir(), 'attribution-')), 'a.ts');

    writeFileSync(file, UNION);

    const context = planted({ 'slow-rule': slow });

    context.activeRules = ['slow-rule', 'union-newline'];

    const dominant = dominantRule(context, file);

    expect(dominant.rule).toBe('slow-rule');
    expect(dominant.ms).toBeGreaterThan(20);
    expect(dominant.baseline).toBeGreaterThanOrEqual(0);
  });
});
