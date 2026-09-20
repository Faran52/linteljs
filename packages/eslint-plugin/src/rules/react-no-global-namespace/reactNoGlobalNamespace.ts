import { createRule } from '../../types.ts';
import { scopeOf, sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  type Fixer,
  mustFind,
  type NamedNode,
  type Ranged,
  rangeOf,
  type RuleNode,
  type TypedNode,
} from '../../utils/ruleUtils.ts';

import { globalNamespaceTags } from './utils/elementUtils.ts';
import { nameOf } from './utils/nameUtils.ts';

import type { AST, Scope } from 'eslint';

// `TSQualifiedName` is absent from ESLint's ESTree types, so the two fields this rule reads are described
// structurally and narrowed by a predicate. A real parsed node satisfies it, and no cast is needed to say so.
interface Qualified {
  left: NamedNode;
  right: NamedNode;
}

// The module an import names. A `Literal` in general carries several value types; an import source is a string.
interface ImportSource {
  value?: string;
}

// One specifier, read for the name it binds and for whether it is a named one a fix may sit beside.
interface ImportSpecifier extends Ranged {
  type: string;
  local: NamedNode;
}

// One import statement, read for the names already bound so a fix never writes a duplicate specifier. `importKind`
// is TypeScript's, marking `import type { ... }`, where a `type` modifier on a specifier is a syntax error.
interface ImportNode {
  importKind?: string;
  source: ImportSource;
  specifiers: ImportSpecifier[];
}

// A named specifier is the only thing a fix can sit beside; a default or namespace one has no list to join.
const namedSpecifiers = (node: ImportNode): ImportSpecifier[] => {
  return node.specifiers.filter((specifier) => {
    return specifier.type === 'ImportSpecifier';
  });
};

const NAMESPACE = 'React';

const MODULE = 'react';

const isQualified = (node: RuleNode): node is RuleNode & Qualified => {
  return 'left' in node && 'right' in node;
};

// `TypedNode` rather than `RuleNode`: this walks `ast.body`, whose members ESLint types as ESTree statements.
const isImport = (node: TypedNode): node is TypedNode & ImportNode => {
  return node.type === 'ImportDeclaration' && 'source' in node && 'specifiers' in node;
};

// Resolves a name against the scope chain, innermost first. `noImportNamespaceDestructure` walks the same way, and
// for the same reason: the node's own scope finds nothing once the reference sits inside a function or block.
const resolveVariable = (scope: Scope.Scope, name: string): Scope.Variable | null => {
  for (let current: Scope.Scope | null = scope; current; current = current.upper) {
    const found = current.variables.find((variable) => {
      return variable.name === name;
    });

    if (found) {
      return found;
    }
  }

  return null;
};

export const reactNoGlobalNamespace = createRule('react-no-global-namespace', {
  meta: {
    type: 'suggestion',
    docs: {
      language: 'universal',
      recommended: false,
      description:
        'Import the React names a file uses instead of reaching them through the global namespace.',
    },
    messages: {
      globalNamespace:
        'Import `{{name}}` from `react` rather than reaching it through the `React` global.',
    },
    fixable: 'code',
    schema: [],
  },
  create: (context) => {
    const source = sourceCodeOf(context);

    // The file's own `react` import, which a fix merges into rather than writing a second statement beside it.
    const existingImport = (): (TypedNode & ImportNode) | undefined => {
      for (const statement of source.ast.body) {
        if (isImport(statement) && statement.source.value === MODULE) {
          return statement;
        }
      }

      return undefined;
    };

    /**
     * `React.ReactNode` in a type position and `React.createElement` in a value one are the same reach through the
     * same global, so both land here. `member` is what the fix replaces; `isType` decides whether the specifier it
     * adds carries `type`.
     */
    const report = (member: RuleNode, name: string, isType: boolean, targets: AST.Range[]): void => {
      const scope = scopeOf(context, member);

      // A local `React` is the file's own binding, so reaching through it is a namespace this file owns.
      if (resolveVariable(scope, NAMESPACE) !== null) {
        return;
      }

      const existing = existingImport();
      const alreadyImported = existing?.specifiers.some((specifier) => {
        return specifier.local.name === name;
      }) === true;

      // Bound to something else already, so replacing the member access would quietly mean a different value.
      const collides = !alreadyImported && resolveVariable(scope, name) !== null;

      // The list a fix may join, absent for a type-only import and for one with no named specifiers.
      const mergeable = existing !== undefined && existing.importKind !== 'type'
        ? namedSpecifiers(existing)[0]
        : undefined;

      const rewrite = (fixer: Fixer): ReturnType<Fixer['replaceText']>[] => {
        const specifier = isType ? `type ${name}` : name;

        // A range each, because a JSX element carries the reach twice and both tags have to move together.
        const replaced = targets.map((target) => {
          return fixer.replaceTextRange(target, name);
        });

        if (alreadyImported) {
          return replaced;
        }

        // No import to join: none from `react` at all, a type-only one, or one carrying no named list. A second
        // `import { ... } from 'react'` beside any of those is valid, which rewriting them into one is not.
        if (existing === undefined || mergeable === undefined) {
          // A file with a `React.` reference has a statement to insert before, which is what `mustFind` says here.
          const statement = mustFind(source.ast.body[0]);

          return [
            fixer.insertTextBefore(statement, `import { ${specifier} } from '${MODULE}';\n\n`),
            ...replaced,
          ];
        }

        /**
         * Beside the first named specifier, rather than by rewriting the statement's text. Rewriting it guessed at
         * the quote style and at whether there was a list to join, and produced `import * as R, { X } from 'react'`
         * and `import type { type X }`, neither of which parses.
         */
        return [
          fixer.insertTextBeforeRange(rangeOf(mergeable), `${specifier}, `),
          ...replaced,
        ];
      };

      context.report({
        node: member,
        messageId: 'globalNamespace',
        data: { name },
        fix: collides ? null : rewrite,
      });
    };

    return {
      // `React.ReactNode`, in a type.
      TSQualifiedName: (node: RuleNode) => {
        if (isQualified(node) && node.left.name === NAMESPACE) {
          report(node, node.right.name, true, [rangeOf(node)]);
        }
      },

      /**
       * `<React.Fragment>`, in markup. A JSX tag name is not a member expression, so the visitor below never sees
       * one, and both tags are rewritten by a single fix: half of that rename does not parse, and ESLint writes
       * whatever the last pass produced.
       */
      JSXElement: (node: RuleNode) => {
        const tags = globalNamespaceTags(node, NAMESPACE);
        const [opening] = tags;

        if (opening === undefined) {
          return;
        }

        report(node, mustFind(opening.property?.name), false, tags.map(rangeOf));
      },

      // `React.createElement`, in a value. A computed access names nothing a fix could import, and is the only way
      // the property of a member expression is not an identifier, so the guard covers both.
      MemberExpression: (node) => {
        if (node.computed || node.object.type !== 'Identifier' || node.object.name !== NAMESPACE) {
          return;
        }

        report(node, mustFind(nameOf(node.property)), false, [rangeOf(node)]);
      },
    };
  },
});

export default reactNoGlobalNamespace;
