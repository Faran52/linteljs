import { createRule } from '../../types.ts';
import {
  ancestorReaderOf,
  declaredVariablesOf,
  physicalFilenameOf,
  sourceCodeOf,
} from '../../utils/compatUtils.ts';
import {
  optionsOf,
  rangeOf,
  type RuleContext,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

import {
  isInsideFunctionBody,
  isSafeToConvert,
  SAFE_DECLARATION_PARENTS,
  sitsInUnsafePosition,
} from './safetyUtils.ts';
import {
  type FunctionLike,
  getFunctionId,
  writeArrowConstant,
  writeArrowFunction,
} from './writeUtils.ts';

import type { Scope } from 'eslint';

// One frame of the `this` walk's stack; `isClassBound` marks a frame bound to a class instance, where it stops.
interface FunctionFrame {
  node: FunctionLike;
  isArrow: boolean;
  isClassBound: boolean;
}

interface PreferArrowFunctionsOptions {
  forceHoisted: boolean;
}

const SKIPPED_PROPERTY_KINDS = new Set(['get', 'set']);

// The variable a function's own name binds; a function declares at most one, so the first element is it.
const nameVariableOf = (context: RuleContext, fn: FunctionLike): Scope.Variable | undefined => {
  const [nameVariable] = declaredVariablesOf(context, fn);

  return nameVariable;
};

const isAnonymousDefaultExport = (fn: FunctionLike): boolean => {
  return fn.parent.type === 'ExportDefaultDeclaration' && getFunctionId(fn) === null;
};

const isClassMemberValue = (fn: FunctionLike): boolean => {
  const parentType = fn.parent.type;
  return parentType === 'PropertyDefinition' || parentType === 'MethodDefinition';
};

const buildFrame = (fn: FunctionLike): FunctionFrame => {
  return {
    node: fn,
    isArrow: fn.type === 'ArrowFunctionExpression',
    isClassBound: isClassMemberValue(fn),
  };
};

export const preferArrowFunctions = createRule('prefer-arrow-functions', {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'functions',
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
    const sourceCode = sourceCodeOf(context);
    const isTsx = physicalFilenameOf(context).endsWith('.tsx');

    // Off by default: no lint rule can tell a call that runs before declaration from one that only reads that way.
    const forceHoisted = optionsOf<PreferArrowFunctionsOptions>(context).forceHoisted ?? false;

    // Every function visitor fires on `:exit`, so by the time a function is judged each `this` in it is recorded.
    const functionStack: FunctionFrame[] = [];
    const containsThis = new WeakSet<FunctionLike>();

    // Whether the function calls itself by name, which an arrow has none of:
    // `function fact(n) { fact(n-1) }` would recurse into an unresolved global.
    const referencesOwnName = (fn: FunctionLike): boolean => {
      const nameVariable = nameVariableOf(context, fn);

      return nameVariable !== undefined
        && nameVariable.name === getFunctionId(fn)?.name
        && nameVariable.references.length > 0;
    };

    // A `function` is hoisted, so an earlier call is legal; a `const` arrow sits in its dead zone and throws.
    const isReferencedBeforeDeclaration = (
      fn: FunctionLike,
      nameVariable: Scope.Variable,
    ): boolean => {
      const [declarationStart] = rangeOf(fn);

      return nameVariable.references.some((reference) => {
        const range = reference.identifier.range;

        if (range === undefined || range[0] >= declarationStart) {
          return false;
        }

        // A call inside another function body runs whenever that function is called, not
        // at this point; matches the line `no-use-before-define` draws with `functions: false`.
        return !isInsideFunctionBody(ancestorReaderOf(context), reference.identifier);
      });
    };

    // A `function` binding is writable, constructible and carries a `prototype`; an arrow on a `const` has none.
    const hasFunctionOnlyUsage = (nameVariable: Scope.Variable): boolean => {
      return nameVariable.references.some((reference) => {
        if (reference.isWrite()) {
          return true;
        }

        const { parent } = reference.identifier as RuleNode;

        if (parent?.type === 'NewExpression' && parent.callee === reference.identifier) {
          return true;
        }

        return parent?.type === 'MemberExpression'
          && parent.object === reference.identifier
          && parent.property.type === 'Identifier'
          && parent.property.name === 'prototype';
      });
    };

    // `function x() {} function x() {}` is legal when var-scoped, and a TypeScript overload
    // implementation counts too; `const` may not be bound twice.
    const isRedeclared = (nameVariable: Scope.Variable): boolean => {
      return nameVariable.defs.length > 1;
    };

    const reportFix = (
      fn: FunctionLike,
      messageId: 'preferArrow' | 'preferExplicit',
      replacement: string,
      target: RuleNode = fn,
    ): void => {
      // Gated for `preferArrow` only: `preferExplicit` turns an arrow into an arrow, so the gate cannot change.
      if (messageId === 'preferArrow' && !isSafeToConvert(sourceCode, fn, containsThis)) {
        return;
      }

      // The arrow is assembled from parameter and body text, so a comment elsewhere has nowhere to go: report, no fix.
      const rebuildLosesAComment = sourceCode.getCommentsInside(fn).length
        > sourceCode.getCommentsInside(fn.body).length;

      context.report({
        node: fn,
        messageId,
        fix: rebuildLosesAComment
          ? null
          : (fixer) => {
              return fixer.replaceText(target, replacement);
            },
      });
    };

    return {
      ':function': (node: FunctionLike) => {
        functionStack.push(buildFrame(node));
      },

      ':function:exit': () => {
        functionStack.pop();
      },

      'ThisExpression': () => {
        // Mark every frame `this` is inherited through, stopping at the first owner;
        // reversed on a copy since the stack belongs to the two visitors.
        for (const frame of [...functionStack].reverse()) {
          containsThis.add(frame.node);

          if (!frame.isArrow || frame.isClassBound) {
            break;
          }
        }
      },

      'ExportDefaultDeclaration > FunctionDeclaration:exit': (fn: FunctionLike) => {
        if (!isAnonymousDefaultExport(fn)) {
          return;
        }

        reportFix(fn, 'preferArrow', `${writeArrowFunction(sourceCode, fn, isTsx)};`);
      },

      'FunctionDeclaration[parent.type!="ExportDefaultDeclaration"]:exit': (fn: FunctionLike) => {
        // A statement position that takes a declaration but not a lexical one, so the `const` this visitor
        // writes would not parse; silent, since `function` is the only spelling it accepts.
        if (!SAFE_DECLARATION_PARENTS.has(fn.parent.type)) {
          return;
        }

        // The three readers below all ask about this declaration's own binding, so it is resolved once here.
        const nameVariable = nameVariableOf(context, fn);

        /* v8 ignore next 3 -- a function declaration always declares its own name */
        if (!nameVariable) {
          return;
        }

        // Needs to stay a `function` to be constructed, reassigned, carry a prototype, or be declared twice.
        if (hasFunctionOnlyUsage(nameVariable) || isRedeclared(nameVariable)) {
          return;
        }

        // The only visitor that produces a `const`, so the only one where hoisting matters;
        // still reported with no fix so the exception does not look like an oversight.
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

      // Keyed on the function: a property's `value` is an ESTree node with no `parent`, which everything below needs.
      'FunctionExpression[parent.type="Property"]:exit': (fn: FunctionLike) => {
        const property = fn.parent;

        /* v8 ignore next 3 -- the selector only matches a property's value */
        if (property.type !== 'Property') {
          return;
        }

        if (SKIPPED_PROPERTY_KINDS.has(property.kind)) {
          return;
        }

        // Checked here too, because a property value reaches this visitor instead of the plain function-expression one.
        if (referencesOwnName(fn)) {
          return;
        }
        const arrow = writeArrowFunction(sourceCode, fn, isTsx);

        if (!property.method) {
          // Long form: `{ foo: function() {...} }`, so replace just the value.
          reportFix(fn, 'preferArrow', arrow);
          return;
        }

        // Shorthand method: the value's source span excludes the property name, so
        // replacing only the value yields `foo() => {...}`, a parse error.
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
        reportFix(fn, 'preferExplicit', writeArrowFunction(sourceCode, fn, isTsx));
      },
    };
  },
});
