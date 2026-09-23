import { createRule } from '../../types.ts';
import {
  declaredVariablesOf,
  physicalFilenameOf,
  sourceCodeOf,
} from '../../utils/compatUtils.ts';
import {
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

interface PropertyMatch {
  type: 'Property';
}

type PropertyNode = Extract<RuleNode, PropertyMatch>;

const SKIPPED_PROPERTY_KINDS = new Set(['get', 'set']);

// The variable a function's own name binds; a function declares at most one, so the first element is it.
const nameVariableOf = (context: RuleContext, fn: FunctionLike): Scope.Variable | undefined => {
  const [nameVariable] = declaredVariablesOf(context, fn);

  return nameVariable;
};

// A method's value is a `function` and stops the walk as one, so only an arrow in a class field needs marking.
const isClassMemberValue = (fn: FunctionLike): boolean => {
  return fn.parent.type === 'PropertyDefinition';
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
    const propertyOf = new WeakMap<object, PropertyNode>();

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

      // Any earlier mention, wherever it sits. A reference inside another function only looks safe: that
      // function may itself be called above this declaration, and the dead zone is then two hops away.
      return nameVariable.references.some((reference) => {
        return rangeOf(reference.identifier)[0] < declarationStart;
      });
    };

    // A `function` binding is writable, constructible and carries a `prototype`; an arrow on a `const` has none.
    const hasFunctionOnlyUsage = (nameVariable: Scope.Variable): boolean => {
      return nameVariable.references.some((reference) => {
        if (reference.isWrite()) {
          return true;
        }

        // An identifier is never the Program, and ESLint 5 on links every node in a full pass before any listener.
        const parent = mustFind((reference.identifier as RuleNode).parent);

        if (parent.type === 'NewExpression' && parent.callee === reference.identifier) {
          return true;
        }

        return parent.type === 'MemberExpression'
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
        if (getFunctionId(fn) !== null) {
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

        // A named function declaration always declares its own name.
        const nameVariable = mustFind(nameVariableOf(context, fn));

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

      // Recorded on the way down, so the visitor below reads its property already typed as one.
      'Property': (property: PropertyNode) => {
        propertyOf.set(property.value, property);
      },

      // Keyed on the function: a property's `value` is an ESTree node with no `parent`, which everything below needs.
      'FunctionExpression[parent.type="Property"]:exit': (fn: FunctionLike) => {
        // The selector matched a property's value, and the visitor above recorded every one on entering it.
        const property = mustFind(propertyOf.get(fn));

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
