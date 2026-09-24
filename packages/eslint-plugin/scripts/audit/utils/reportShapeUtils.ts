import { nodeOf, walkAst } from './astUtils.ts';

import type { Linter, Rule } from 'eslint';
import type { AncestorReader } from '../../../src/utils/ruleUtils.ts';
import type { AstNode, Program } from './astUtils.ts';

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

const PROMISE_METHODS = new Set(['catch', 'finally', 'then']);
const FUNCTION_LIKE = new Set(['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression']);

// An arrow inherits `this` and friends, so the hunt walks into nested arrows and stops at what binds its own.
const OWNS_ITS_THIS = new Set(['ClassBody', 'FunctionDeclaration', 'FunctionExpression']);

/**
 * A `function` is hoisted and a `const` arrow is not, so converting a declaration called above itself breaks code
 * while every fix-and-diff property still holds. Written out here rather than imported from the rule, since a check
 * sharing the code it checks agrees with every bug in it.
 */
export const hoistedProbe: Rule.RuleModule = {
  create: (context) => {
    const { sourceCode } = context;
    const reader: AncestorReader = sourceCode;

    return {
      FunctionDeclaration: (node) => {
        const [variable] = sourceCode.getDeclaredVariables(node);
        const start = node.range?.[0] ?? 0;

        const early = variable?.references.some((reference) => {
          // A call from inside another function body does not run at that point; `no-use-before-define` agrees.
          return (reference.identifier.range?.[0] ?? start) < start
            && !reader.getAncestors(reference.identifier).some((ancestor) => {
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
  },
};

const at = (node: AstNode): string => {
  return `${String(node.loc.start.line)}:${String(node.loc.start.column)}`;
};

// ESLint columns are one-based, `loc` columns are not.
export const atReport = (report: Linter.LintMessage): string => {
  return `${String(report.line)}:${String(report.column - 1)}`;
};

// A name in a non-computed member or key slot, not a reference to a binding.
const isPropertyName = (parent: AstNode | undefined, key: string | undefined): boolean => {
  return parent !== undefined && parent.computed !== true
    && ((parent.type === 'MemberExpression' && key === 'property') || (parent.type === 'Property' && key === 'key'));
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
  const body = nodeOf(fn.body);
  let found: string | undefined;

  if (body !== undefined) {
    walkAst(body, (node, parent, key) => {
      if (found !== undefined || (node !== body && OWNS_ITS_THIS.has(node.type))) {
        return false;
      }

      found = hazardOf(node, parent, key);

      return found === undefined;
    });
  }

  return found;
};

// Where each report-only rule may report, derived from the AST. `promise[then](parse)` is why this exists.
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
    const {
      callee,
      id,
      init,
    } = node;

    if (FUNCTION_LIKE.has(node.type)) {
      shapes.functions.set(at(node), node);
    }

    if (node.type === 'CallExpression' && callee?.type === 'MemberExpression' && callee.computed !== true
      && callee.property?.type === 'Identifier' && PROMISE_METHODS.has(callee.property.name ?? '')) {
      shapes.promiseCalls.add(at(callee.property));
    }

    if (node.type === 'VariableDeclarator' && id?.type === 'ObjectPattern' && init?.type === 'Identifier'
      && namespaces.has(init.name ?? '')) {
      shapes.namespaceDestructures.add(at(node));
    }

    return true;
  });

  return shapes;
};

const finding = (ruleId: string, category: string, detail: string): Finding => {
  return {
    category,
    detail,
    rules: [ruleId.replace('@linteljs/', '')],
  };
};

// One report against the shape its rule claims and, for a conversion, against the original function body.
export const judge = (report: Linter.LintMessage, shapes: Shapes, probed: Set<string>): Finding | undefined => {
  const spot = atReport(report);
  const ruleId = report.ruleId ?? '';

  if (REPORT_ONLY_RULES.has(ruleId)) {
    const allowed = ruleId === '@linteljs/no-import-namespace-destructure'
      ? shapes.namespaceDestructures
      : shapes.promiseCalls;

    return allowed.has(spot)
      ? undefined
      : finding(ruleId, 'report shape', `report at ${spot} is not the shape the rule claims`);
  }

  // Only `preferArrow` with a fix converts: `preferExplicit` rewrites an arrow into an arrow.
  if (report.messageId !== 'preferArrow' || report.fix === undefined) {
    return undefined;
  }

  const fn = shapes.functions.get(spot);

  if (fn === undefined) {
    return finding(ruleId, 'report shape', `conversion reported at ${spot}, which is not a function`);
  }

  const hazard = bodyHazard(fn);

  if (hazard !== undefined) {
    return finding(ruleId, 'CRITICAL: guard leaked',
      `converted a function whose own body uses \`${hazard}\`, which an arrow rebinds`);
  }

  return fn.type === 'FunctionDeclaration' && probed.has(spot)
    ? finding(ruleId, 'CRITICAL: guard leaked',
        'converted a declaration called above itself, which a `const` cannot support')
    : undefined;
};
