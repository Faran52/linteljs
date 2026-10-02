import { adjacentPairs } from '../../../utils/layoutUtils.ts';
import {
  mustFind,
  type RuleNode,
  type SourceCode,
} from '../../../utils/ruleUtils.ts';

import type { FunctionLike } from './writeUtils.ts';

// An allow-list: anything consuming after a block-bodied arrow breaks, so this fails closed.
const SAFE_FUNCTION_PARENTS = new Set([
  'ArrayExpression',
  'AssignmentExpression',
  'ExportDefaultDeclaration',
  'ExpressionStatement',
  'JSXExpressionContainer',
  'Property',
  'PropertyDefinition',
  'ReturnStatement',
  'SpreadElement',
  'VariableDeclarator',
]);

// Annex B permits sloppy function declarations in unbraced positions where `const` cannot go.
export const SAFE_DECLARATION_PARENTS = new Set([
  'BlockStatement',
  'ExportNamedDeclaration',
  'Program',
  'StaticBlock',
  'SwitchCase',
  'TSModuleBlock',
]);

// `void`, `typeof`, `as` and `satisfies` need parentheses around an arrow.
export const sitsInUnsafePosition = (sourceCode: SourceCode, fn: FunctionLike): boolean => {
  const { parent } = fn;

  // An arrow cannot be constructed.
  if (parent.type === 'NewExpression') {
    return parent.callee === fn;
  }

  // `(function(){})()` keeps the parens on the arrow; Crockford's `(function(){}())` leaves it bare.
  if (parent.type === 'CallExpression') {
    if (parent.callee !== fn) {
      return false;
    }

    const nextToken = mustFind(sourceCode.getTokenAfter(fn));

    return nextToken.value !== ')';
  }

  return !SAFE_FUNCTION_PARENTS.has(parent.type);
};

const isAssertionFunction = (fn: FunctionLike): boolean => {
  const annotation = fn.returnType?.typeAnnotation;
  return annotation?.type === 'TSTypePredicate' && annotation.asserts === true;
};

// Parameter properties are constructor-only.
const hasThisParameter = (fn: FunctionLike): boolean => {
  const [first] = fn.params;

  return first?.type === 'Identifier' && first.name === 'this';
};

// Identifiers only is exhaustive: any other param makes the list non-simple, where repeats are a SyntaxError.
const hasDuplicateParameters = (fn: FunctionLike): boolean => {
  const names = fn.params
    .filter((param) => {
      return param.type === 'Identifier';
    })
    .map((param) => {
      return param.name;
    });

  return new Set(names).size !== names.length;
};

const containsToken = (sourceCode: SourceCode, node: RuleNode, type: string, value: string): boolean => {
  return sourceCode
    .getTokens(node)
    .some((token) => {
      return token.type === type && token.value === value;
    });
};

// `node.arguments.length` is an Identifier too, so only a `.`/`?.` in front rules it out.
const readsArgumentsObject = (sourceCode: SourceCode, fn: FunctionLike): boolean => {
  const tokens = sourceCode.getTokens(fn);
  const tokenPairs = [...adjacentPairs(tokens)];

  return tokenPairs
    .some(([before, token]) => {
      return token.type === 'Identifier'
        && token.value === 'arguments'
        && before.value !== '.'
        && before.value !== '?.';
    });
};

// `new.target` has no arrow equivalent, so match its three-token sequence.
const NEW_DOT_TARGET: [string, string][] = [
  ['Keyword', 'new'],
  ['Punctuator', '.'],
  ['Identifier', 'target'],
];

// No function ends on `new` or `new .`, so each index read here is inside the list.
const containsNewDotTarget = (sourceCode: SourceCode, node: RuleNode): boolean => {
  const tokens = sourceCode.getTokens(node);

  return tokens
    .some((_, index) => {
      return NEW_DOT_TARGET
        .every(([type, value], offset) => {
          const token = mustFind(tokens[index + offset]);

          return token.type === type && token.value === value;
        });
    });
};

export const isSafeToConvert = (
  sourceCode: SourceCode,
  fn: FunctionLike,
  containsThis: WeakSet<FunctionLike>,
): boolean => {
  if (fn.generator === true || isAssertionFunction(fn) || hasThisParameter(fn) || hasDuplicateParameters(fn)) {
    return false;
  }

  if (containsThis.has(fn)) {
    return false;
  }

  if (containsToken(sourceCode, fn, 'Keyword', 'super')) {
    return false;
  }

  if (readsArgumentsObject(sourceCode, fn)) {
    return false;
  }

  return !containsNewDotTarget(sourceCode, fn);
};
