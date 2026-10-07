import {
  type AstNode,
  type Program,
  walkAst,
} from '../../utils/astUtils.ts';

import type { Linter, Rule } from 'eslint';
import type { AncestorReader } from '../../../../src/utils/ruleUtils.ts';

export interface Finding {
  category: string;
  detail: string;
  rules: string[];
}

export interface Shapes {
  functions: Map<string, AstNode>;
  namespaceDestructures: Set<string>;
  promiseCalls: Set<string>;
}

export const AUDIT_RULES = [
  'no-import-namespace-destructure',
  'prefer-arrow-functions',
  'prefer-await-to-then',
  'prefer-try-catch',
];

const REPORT_ONLY_RULES = new Set([
  '@linteljs/no-import-namespace-destructure',
  '@linteljs/prefer-await-to-then',
  '@linteljs/prefer-try-catch',
]);

const PROMISE_METHODS = new Set([
  'catch',
  'finally',
  'then',
]);
const FUNCTION_LIKE = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

// An arrow inherits `this` and friends, so the hunt walks into nested arrows and stops at what binds its own.
const OWNS_ITS_THIS = new Set([
  'ClassBody',
  'FunctionDeclaration',
  'FunctionExpression',
]);

// A `function` is hoisted and a `const` arrow is not, and no fix-and-diff property catches it.
// Written out rather than imported: a check sharing the code it checks agrees with its bugs.
export const hoistedProbe: Rule.RuleModule = {
  create: (context) => {
    const { sourceCode } = context;
    const reader: AncestorReader = sourceCode;
    const visitors: Rule.RuleListener = {
      FunctionDeclaration: (node) => {
        const [variable] = sourceCode.getDeclaredVariables(node);
        const [start] = sourceCode.getRange(node);

        const early = variable?.references
          .some((reference) => {
          // A call from inside another function body does not run at that point; `no-use-before-define` agrees.
            return Number(reference.identifier.range?.[0]) < start
              && !reader
                .getAncestors(reference.identifier)
                .some((ancestor) => {
                  return FUNCTION_LIKE.has(ancestor.type);
                });
          }) ?? false;

        if (early) {
          context.report({
            node,
            message: 'called above its own declaration',
          });
        }
      },
    };

    return visitors;
  },
};

const at = (node: AstNode): string => {
  return `${String(node.loc.start.line)}:${String(node.loc.start.column)}`;
};

// ESLint columns are one-based, `loc` columns are not.
export const atReport = (report: Linter.LintMessage): string => {
  return `${String(report.line)}:${String(report.column - 1)}`;
};

const isPropertyName = (parent: AstNode | undefined, key: string | undefined): boolean => {
  if (parent === undefined || parent.computed === true) {
    return false;
  }

  const isMemberProperty = parent.type === 'MemberExpression' && key === 'property';
  const isPropertyKey = parent.type === 'Property' && key === 'key';

  return isMemberProperty || isPropertyKey;
};

// `import.meta` is a MetaProperty too, and module-scoped, so only `new.target` is at stake.
const hazardOf = (node: AstNode, parent: AstNode | undefined, key: string | undefined): string | undefined => {
  if (node.type === 'ThisExpression') {
    return 'this';
  }

  if (node.type === 'Super') {
    return 'super';
  }

  if (node.type === 'MetaProperty' && node.meta?.name === 'new') {
    return 'new.target';
  }

  return node.type === 'Identifier' && node.name === 'arguments' && !isPropertyName(parent, key)
    ? 'arguments'
    : undefined;
};

const bodyHazard = (fn: AstNode): string | undefined => {
  let found: string | undefined;

  walkAst(fn, (node, parent, key) => {
    if (found !== undefined || (node !== fn && OWNS_ITS_THIS.has(node.type))) {
      return false;
    }

    found = hazardOf(node, parent, key);

    return found === undefined;
  });

  return found;
};

const isIdentifierIn = (node: AstNode | null | undefined, names: ReadonlySet<string | undefined>): node is AstNode => {
  return node?.type === 'Identifier' && names.has(node.name);
};

const isPlainMember = (node: AstNode | undefined): node is AstNode => {
  return node?.type === 'MemberExpression' && node.computed !== true;
};

const promiseMethodOf = (node: AstNode): AstNode | undefined => {
  const { callee } = node;
  const property = node.type === 'CallExpression' && isPlainMember(callee) ? callee.property : undefined;

  return isIdentifierIn(property, PROMISE_METHODS) ? property : undefined;
};

const isNamespaceDestructure = (node: AstNode, namespaces: Set<string>): boolean => {
  return node.type === 'VariableDeclarator' && node.id?.type === 'ObjectPattern'
    && isIdentifierIn(node.init, namespaces);
};

// `promise[then](parse)` is why this exists.
export const shapesOf = (ast: Program): Shapes => {
  const namespaces = new Set<string>();
  const shapes: Shapes = {
    functions: new Map(),
    namespaceDestructures: new Set(),
    promiseCalls: new Set(),
  };

  walkAst(ast, (node) => {
    if (node.type === 'ImportNamespaceSpecifier' && node.local?.name !== undefined) {
      namespaces.add(node.local.name);
    }

    return true;
  });

  walkAst(ast, (node) => {
    if (FUNCTION_LIKE.has(node.type)) {
      shapes.functions.set(at(node), node);
    }

    const method = promiseMethodOf(node);

    if (method) {
      shapes.promiseCalls.add(at(method));
    }

    if (isNamespaceDestructure(node, namespaces)) {
      shapes.namespaceDestructures.add(at(node));
    }

    return true;
  });

  return shapes;
};

const finding = (ruleId: string, category: string, detail: string): Finding => {
  const reported = {
    category,
    detail,
    rules: [ruleId.replace('@linteljs/', '')],
  };

  return reported;
};

const judgeReportOnly = (ruleId: string, spot: string, shapes: Shapes): Finding | undefined => {
  const allowed = ruleId === '@linteljs/no-import-namespace-destructure'
    ? shapes.namespaceDestructures
    : shapes.promiseCalls;

  return allowed.has(spot)
    ? undefined
    : finding(ruleId, 'report shape', `report at ${spot} is not the shape the rule claims`);
};

// Only `preferArrow` with a fix converts: `preferExplicit` rewrites an arrow into an arrow.
const converts = (report: Linter.LintMessage): boolean => {
  return report.messageId === 'preferArrow' && report.fix !== undefined;
};

const judgeConversion = (ruleId: string, spot: string, fn: AstNode, probed: Set<string>): Finding | undefined => {
  const hazard = bodyHazard(fn);

  if (hazard !== undefined) {
    return finding(
      ruleId,
      'CRITICAL: guard leaked',
      `converted a function whose own body uses \`${hazard}\`, which an arrow rebinds`,
    );
  }

  return fn.type === 'FunctionDeclaration' && probed.has(spot)
    ? finding(
        ruleId,
        'CRITICAL: guard leaked',
        'converted a declaration called above itself, which a `const` cannot support',
      )
    : undefined;
};

export const judge = (report: Linter.LintMessage, shapes: Shapes, probed: Set<string>): Finding | undefined => {
  const spot = atReport(report);
  const ruleId = report.ruleId ?? '';

  if (REPORT_ONLY_RULES.has(ruleId)) {
    return judgeReportOnly(ruleId, spot, shapes);
  }

  if (!converts(report)) {
    return undefined;
  }

  const fn = shapes.functions.get(spot);

  return fn === undefined
    ? finding(ruleId, 'report shape', `conversion reported at ${spot}, which is not a function`)
    : judgeConversion(ruleId, spot, fn, probed);
};
