import {
  createRule,
  isIdentifierNamed,
  mustFind,
  optionsOf,
  rangeOf,
  type RuleContext,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import {
  isSafeToConvert,
  SAFE_DECLARATION_PARENTS,
  sitsInUnsafePosition,
} from './utils/safetyUtils.ts';
import {
  type FunctionLike,
  getFunctionId,
  writeArrowConstant,
  writeArrowFunction,
} from './utils/writeUtils.ts';

import type {
  AST,
  Rule,
  Scope,
} from 'eslint';

interface FunctionFrame {
  node: FunctionLike;
  isArrow: boolean;
  isClassBound: boolean;
}

interface PreferArrowFunctionsOptions {
  forceHoisted: boolean;
}

interface PropertyMatch {
  type: 'Property';
}

interface FunctionDeclarationMatch {
  type: 'FunctionDeclaration';
}

type PropertyNode = Extract<RuleNode, PropertyMatch>;
type FunctionDeclarationNode = Extract<RuleNode, FunctionDeclarationMatch>;

const SKIPPED_PROPERTY_KINDS = new Set(['get', 'set']);

const nameVariableOf = (context: RuleContext, fn: FunctionLike): Scope.Variable | undefined => {
  const [nameVariable] = context.sourceCode.getDeclaredVariables(fn);

  return nameVariable;
};

// A method's value is a `function` and stops the walk, so only a class-field arrow needs marking.
const isClassMemberValue = (fn: FunctionLike): boolean => {
  return fn.parent.type === 'PropertyDefinition';
};

// An identifier is never the Program, and ESLint links every node in a full pass before any listener.
const parentOf = (reference: Scope.Reference): RuleNode => {
  return mustFind((reference.identifier as RuleNode).parent);
};

// StyleX takes a dynamic style only as `(x) => ({ ... })`; a block body fails its build.
const isStylexStyle = (fn: FunctionLike): boolean => {
  if (fn.parent.type !== 'Property') {
    return false;
  }

  const call = mustFind(fn.parent.parent.parent);

  return call.type === 'CallExpression'
    && call.callee.type === 'MemberExpression'
    && isIdentifierNamed(call.callee.object, 'stylex')
    && isIdentifierNamed(call.callee.property, 'create');
};

const buildFrame = (fn: FunctionLike): FunctionFrame => {
  const frame: FunctionFrame = {
    node: fn,
    isArrow: fn.type === 'ArrowFunctionExpression',
    isClassBound: isClassMemberValue(fn),
  };

  return frame;
};

export const preferArrowFunctions = createRule('prefer-arrow-functions', {
  meta: {
    type: 'suggestion',
    docs: {
      language: 'universal',
      recommended: true,
      description: 'Prefer arrow functions when the conversion keeps behaviour the same.',
    },
    fixable: 'code',
    messages: {
      preferArrow: 'Prefer using arrow functions over plain functions',
      preferExplicit: 'Prefer using explicit returns when the arrow function contains only a return',
      preferArrowHoisted:
        'Prefer arrow functions, but this one is used before it is declared. '
        + 'Converting it to `const` would throw at runtime, so move the usage below the '
        + 'declaration first, then this fixes itself.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          forceHoisted: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const { sourceCode } = context;
    const isTsx = context.physicalFilename.endsWith('.tsx');

    // Off by default: no lint rule can tell a call that runs before declaration from one that only reads that way.
    const forceHoisted = optionsOf<PreferArrowFunctionsOptions>(context).forceHoisted ?? false;

    // Every function visitor fires on `:exit`, so each `this` in it is recorded by then.
    const functionStack: FunctionFrame[] = [];
    const containsThis = new WeakSet<FunctionLike>();
    const propertyOf = new WeakMap<object, PropertyNode>();

    // An arrow has no name to recurse on.
    const referencesOwnName = (fn: FunctionLike): boolean => {
      const nameVariable = nameVariableOf(context, fn);

      return nameVariable !== undefined
        && nameVariable.name === getFunctionId(fn)?.name
        && nameVariable.references.length > 0;
    };

    // A `function` is hoisted; a `const` arrow sits in its dead zone and throws.
    const isReferencedBeforeDeclaration = (
      fn: FunctionLike,
      nameVariable: Scope.Variable,
    ): boolean => {
      const [declarationStart] = rangeOf(fn);
      const [, blockEnd] = rangeOf(fn.parent);
      const previous = sourceCode.getTokenBefore(fn);

      // Only a declaration is hoisted; one inside another function is called from there, once `fn` exists.
      // The Program holds `fn`, so the walk always stops before it runs out of parents.
      const outermostDeclarationOf = (reference: Scope.Reference): FunctionDeclarationNode | undefined => {
        let outermost: FunctionDeclarationNode | undefined;

        for (let node = parentOf(reference); rangeOf(node)[0] > declarationStart; node = mustFind(node.parent)) {
          outermost = node.type === 'FunctionDeclaration' ? node : outermost;
        }

        return outermost;
      };

      // A later mention inside a function declaration only looks safe: that declaration is hoisted too.
      const runsEarly = (reference: Scope.Reference): boolean => {
        const [referenceStart, referenceEnd] = rangeOf(reference.identifier);

        // At or before the last token ahead of the declaration: a reference can be that very token.
        if (previous !== null && referenceStart <= previous.range[0]) {
          return true;
        }

        // A later `case` is reached by jumping past this one, so text order says nothing.
        return fn.parent.type === 'SwitchCase' && referenceEnd > blockEnd;
      };

      // A Set visits each declaration once however often it is added, so mutual calls cannot loop.
      const hoisted = new Set<FunctionDeclarationNode>();

      const follow = (reference: Scope.Reference): boolean => {
        if (runsEarly(reference)) {
          return true;
        }

        const outermost = outermostDeclarationOf(reference);

        if (outermost !== undefined) {
          hoisted.add(outermost);
        }

        return false;
      };

      if (nameVariable.references.some(follow)) {
        return true;
      }

      for (const declaration of hoisted) {
        // An anonymous default export has no name this file could call it by.
        if (getFunctionId(declaration) === null) {
          continue;
        }

        const declarationVariable = mustFind(nameVariableOf(context, declaration));

        if (declarationVariable.references.some(follow)) {
          return true;
        }
      }

      return false;
    };

    // A `function` binding is writable, constructible and carries a `prototype`; an arrow on a `const` has none.
    const hasFunctionOnlyUsage = (nameVariable: Scope.Variable): boolean => {
      return nameVariable.references
        .some((reference) => {
          if (reference.isWrite()) {
            return true;
          }

          const parent = parentOf(reference);

          if (parent.type === 'NewExpression' && parent.callee === reference.identifier) {
            return true;
          }

          return parent.type === 'MemberExpression'
            && parent.object === reference.identifier
            && parent.property.type === 'Identifier'
            && parent.property.name === 'prototype';
        });
    };

    // A var-scoped `function` and a TypeScript overload may bind twice; a `const` may not.
    const isRedeclared = (nameVariable: Scope.Variable): boolean => {
      return nameVariable.defs.length > 1;
    };

    const reportFix = (
      fn: FunctionLike,
      messageId: 'preferArrow' | 'preferExplicit',
      replacement: string,
      target: RuleNode = fn,
    ): void => {
      // `preferExplicit` turns an arrow into an arrow, so the gate cannot change.
      if (messageId === 'preferArrow' && !isSafeToConvert(sourceCode, fn, containsThis)) {
        return;
      }

      // The arrow is assembled from parameter and body text, so a comment elsewhere has nowhere to go.
      const rebuildLosesAComment = sourceCode.getCommentsInside(fn).length
        > sourceCode.getCommentsInside(fn.body).length;

      context.report({
        node: fn,
        messageId,
        fix: rebuildLosesAComment
          ? null
          : (fixer) => {
              const [start] = rangeOf(target);
              const [bodyStart] = rangeOf(fn.body);
              const body = sourceCode.getText(fn.body);

              if (!replacement.endsWith(body)) {
                return fixer.replaceText(target, replacement);
              }

              // A body kept verbatim stays out of the edit, so a fix nested inside it lands in the same pass.
              const headRange: AST.Range = [start, bodyStart];
              const head = replacement.slice(0, -body.length);

              return fixer.replaceTextRange(headRange, head);
            },
      });
    };

    const visitors: Rule.RuleListener = {
      ':function': (node: FunctionLike) => {
        functionStack.push(buildFrame(node));
      },

      ':function:exit': () => {
        functionStack.pop();
      },

      'ThisExpression': () => {
        const innermostFirst = functionStack.toReversed();

        for (const frame of innermostFirst) {
          containsThis.add(frame.node);

          if (!frame.isArrow || frame.isClassBound) {
            break;
          }
        }
      },

      'ExportDefaultDeclaration > FunctionDeclaration:exit': (fn: FunctionLike) => {
        if (getFunctionId(fn) !== null) {
          return;
        }

        reportFix(fn, 'preferArrow', `${writeArrowFunction(sourceCode, fn, isTsx)};`);
      },

      'FunctionDeclaration[parent.type!="ExportDefaultDeclaration"]:exit': (fn: FunctionLike) => {
        // A position that takes a declaration but not a lexical one, so a `const` would not parse.
        if (!SAFE_DECLARATION_PARENTS.has(fn.parent.type)) {
          return;
        }

        const nameVariable = mustFind(nameVariableOf(context, fn));

        if (hasFunctionOnlyUsage(nameVariable) || isRedeclared(nameVariable)) {
          return;
        }

        // The only visitor that writes a `const`, so the only one where hoisting matters.
        if (!forceHoisted
          && isSafeToConvert(sourceCode, fn, containsThis)
          && isReferencedBeforeDeclaration(fn, nameVariable)) {
          context.report({
            node: fn,
            messageId: 'preferArrowHoisted',
          });

          return;
        }

        reportFix(fn, 'preferArrow', `${writeArrowConstant(sourceCode, fn, isTsx)};`);
      },

      'Property': (property: PropertyNode) => {
        propertyOf.set(property.value, property);
      },

      // Keyed on the function: a property's `value` has no `parent`, which everything below needs.
      'FunctionExpression[parent.type="Property"]:exit': (fn: FunctionLike) => {
        const property = mustFind(propertyOf.get(fn));

        if (SKIPPED_PROPERTY_KINDS.has(property.kind)) {
          return;
        }

        // A property value reaches this visitor instead of the plain function-expression one.
        if (referencesOwnName(fn)) {
          return;
        }

        const arrow = writeArrowFunction(sourceCode, fn, isTsx);

        if (!property.method) {
          reportFix(fn, 'preferArrow', arrow);
          return;
        }

        // The value's span excludes the key, so replacing only the value yields `foo() => {...}`.
        const keyText = sourceCode.getText(property.key);
        const key = property.computed ? `[${keyText}]` : keyText;
        reportFix(fn, 'preferArrow', `${key}: ${arrow}`, property);
      },

      'FunctionExpression[parent.type!=/^(Property|MethodDefinition|PropertyDefinition|ClassProperty)$/]:exit':
        (fn: FunctionLike) => {
          if (sitsInUnsafePosition(sourceCode, fn) || referencesOwnName(fn)) {
            return;
          }

          reportFix(fn, 'preferArrow', writeArrowFunction(sourceCode, fn, isTsx));
        },

      'ArrowFunctionExpression[body.type!="BlockStatement"]:exit': (fn: FunctionLike) => {
        if (isStylexStyle(fn)) {
          return;
        }

        reportFix(fn, 'preferExplicit', writeArrowFunction(sourceCode, fn, isTsx));
      },
    };

    return visitors;
  },
});
