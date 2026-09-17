// Reject conversions whose body or position would change meaning; `writeUtils.ts` handles output.
import { adjacentPairs } from '../../../utils/layoutUtils.ts';
import { FUNCTION_TYPES } from '../../../utils/ruleUtils.ts';

import type {
  Ancestor,
  AncestorReader,
  RuleNode,
  SourceCode,
} from '../../../utils/ruleUtils.ts';
import type { FunctionLike } from './writeUtils.ts';

// An allow-list, not a block-list: anything that keeps consuming after a block-bodied arrow
// (`.name`, an operator, `instanceof`, `**`, an optional call, `extends`) breaks, so this fails closed.
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

export const isInsideFunctionBody = (sourceCode: AncestorReader, node: Ancestor): boolean => {
  return sourceCode.getAncestors(node).some((ancestor) => {
    return FUNCTION_TYPES.has(ancestor.type);
  });
};

// `void`, `typeof`, `as` and `satisfies` need parentheses around an arrow.
export const sitsInUnsafePosition = (sourceCode: SourceCode, fn: FunctionLike): boolean => {
  const { parent } = fn;

  // An arrow cannot be constructed, so a `new` callee is out. An argument to `new` is fine.
  if (parent.type === 'NewExpression') {
    return parent.callee === fn;
  }

  // `(function(){})()` parenthesizes the function, so the arrow keeps the parens; Crockford's
  // `(function(){}())` parenthesizes the call, leaving it bare. The token after is `)` or `(`.
  if (parent.type === 'CallExpression') {
    return parent.callee === fn && sourceCode.getTokenAfter(fn)?.value !== ')';
  }

  return !SAFE_FUNCTION_PARENTS.has(parent.type);
};

const isAssertionFunction = (fn: FunctionLike): boolean => {
  const annotation = fn.returnType?.typeAnnotation;
  return annotation?.type === 'TSTypePredicate' && annotation.asserts === true;
};

// A `this` parameter is the first identifier; parameter properties are constructor-only.
const hasThisParameter = (fn: FunctionLike): boolean => {
  const [first] = fn.params;

  return first?.type === 'Identifier' && first.name === 'this';
};

// A non-strict `function` may bind a name twice where an arrow may not. Identifiers only is
// exhaustive: any other param makes the list non-simple, and repeating a name there is a SyntaxError.
const hasDuplicateParameters = (fn: FunctionLike): boolean => {
  const names = fn.params.flatMap((param) => {
    return param.type === 'Identifier' ? [param.name] : [];
  });

  return new Set(names).size !== names.length;
};

const containsToken = (sourceCode: SourceCode, node: RuleNode, type: string, value: string): boolean => {
  return sourceCode.getTokens(node).some((token) => {
    return token.type === type && token.value === value;
  });
};

// `node.arguments.length` is an Identifier too, so only a `.`/`?.` in front rules it out. Paired
// rather than indexed, since a function opens on `function`, `async` or `(`, never on `arguments`.
const readsArgumentsObject = (sourceCode: SourceCode, fn: FunctionLike): boolean => {
  return [...adjacentPairs(sourceCode.getTokens(fn))].some(([before, token]) => {
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

const containsNewDotTarget = (sourceCode: SourceCode, node: RuleNode): boolean => {
  const tokens = sourceCode.getTokens(node);

  return tokens.some((_, index) => {
    return NEW_DOT_TARGET.every(([type, value], offset) => {
      const token = tokens[index + offset];

      return token?.type === type && token.value === value;
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
