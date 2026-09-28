import {
  declaredVariablesOf,
  physicalFilenameOf,
  sourceCodeOf,
} from '../../utils/compatUtils.ts';
import {
  createRule,
  FUNCTION_TYPES,
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

import type { Scope } from 'eslint';

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

const nameVariableOf = (context: RuleContext, fn: FunctionLike): Scope.Variable | undefined => {
  const [nameVariable] = declaredVariablesOf(context, fn);

  return nameVariable;
};

// A method's value is a `function` and stops the walk, so only a class-field arrow needs marking.
const isClassMemberValue = (fn: FunctionLike): boolean => {
  return fn.parent.type === 'PropertyDefinition';
};

// An identifier is never the Program, and ESLint 5 on links every node in a full pass before any listener.
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
      const walked = new Set<RuleNode>();

      // The Program holds `fn`, so the walk always stops before it runs out of parents.
      const outermostFunctionOf = (reference: Scope.Reference): RuleNode | undefined => {
        let outermost: RuleNode | undefined;

        let node = parentOf(reference);

        while (rangeOf(node)[0] > declarationStart) {
          outermost = FUNCTION_TYPES.has(node.type) ? node : outermost;
          node = mustFind(node.parent);
        }

        return outermost;
      };

      // A later mention inside a function declaration only looks safe: that declaration is hoisted too.
      const runsEarly = (reference: Scope.Reference): boolean => {
        const [referenceStart, referenceEnd] = rangeOf(reference.identifier);

        if (referenceStart < declarationStart) {
          return true;
        }

        // A later `case` is reached by jumping past this one, so text order says nothing.
        if (fn.parent.type === 'SwitchCase' && referenceEnd > blockEnd) {
          return true;
        }

        const outermost = outermostFunctionOf(reference);

        if (outermost?.type !== 'FunctionDeclaration' || walked.has(outermost)) {
          return false;
        }

        walked.add(outermost);

        // An anonymous default export has no name, and its parameters are only mentioned inside it.
        return declaredVariablesOf(context, outermost)[0]?.references.some(runsEarly) ?? false;
      };

      return nameVariable.references.some(runsEarly);
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

              // A body kept verbatim stays out of the edit, so a fix nested inside it lands in the same pass.
              return replacement.endsWith(body)
                ? fixer.replaceTextRange([start, bodyStart], replacement.slice(0, -body.length))
                : fixer.replaceText(target, replacement);
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
        // Reversed on a copy, since the stack belongs to the two visitors.
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
  },
});
