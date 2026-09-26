import { createRule } from '../../types.ts';
import {
  ancestorsOf,
  physicalFilenameOf,
  scopeOf,
  sourceCodeOf,
} from '../../utils/compatUtils.ts';
import { getIndent, type Located } from '../../utils/layoutUtils.ts';
import {
  type Fixer,
  isDirective,
  mustFind,
  type NamedNode,
  type Ranged,
  rangeOf,
  resolveVariable,
  type RuleNode,
  type TypedNode,
} from '../../utils/ruleUtils.ts';

import { globalNamespaceTags } from './utils/elementUtils.ts';
import { nameOf } from './utils/nameUtils.ts';

import type { AST } from 'eslint';

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

// One specifier, read for the name it binds, for whether it is a named one a fix may sit beside, and for
// whether `import { type X }` made that binding a type rather than a value.
interface ImportSpecifier extends Ranged {
  type: string;
  importKind?: string;
  local: NamedNode;
}

// `declare` marks an ambient declaration. Described structurally for the same reason `TSQualifiedName` is:
// ESLint's ESTree types carry no such field, and typescript-estree puts it on several node types.
interface Ambient {
  declare?: boolean;
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

const DECLARATION_FILE = /\.d\.[cm]?ts$/;

// A value reach needs a value binding. `import type { Fragment } from 'react'` and `import { type Fragment }`
// both bind a type, and `<Fragment>` against one is a value TypeScript refuses. A type reach takes either.
const bindsUsably = (node: ImportNode, name: string, isType: boolean): boolean => {
  return node.specifiers.some((specifier) => {
    return specifier.local.name === name
      && (isType || (node.importKind !== 'type' && specifier.importKind !== 'type'));
  });
};

const isAmbient = (node: TypedNode & Ambient): boolean => {
  return node.declare === true;
};

// The visitor only sees a `TSQualifiedName`, which always carries both halves, so one key narrows for the two.
const isQualified = (node: RuleNode): node is RuleNode & Qualified => {
  return 'left' in node;
};

// `TypedNode` rather than `RuleNode`: this walks `ast.body`, whose members ESLint types as ESTree statements.
const isImport = (node: TypedNode): node is TypedNode & ImportNode => {
  return node.type === 'ImportDeclaration' && 'source' in node && 'specifiers' in node;
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

    /**
     * An import turns a script into a module, so every global in the file stops being global and
     * `declare module '*.svg'` becomes an augmentation of a module that does not exist. A `.d.ts` is that
     * file by definition. Nothing to say either: the file cannot take the import the message asks for.
     */
    if (DECLARATION_FILE.test(physicalFilenameOf(context))
      || (source.ast.body.some(isAmbient) && !source.ast.body.some(isImport))) {
      return {};
    }

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
     * Where a new import goes: after the prologue, since `'use client'` stops being a directive the moment anything
     * precedes it, and a file with a `React.` reference has an entry past it. svelte-eslint-parser is the one parser
     * whose `Program.body` holds markup: each `<script>` is an element there with its statements beneath it, so the
     * import goes before the statement holding the reference inside its script. A reference in the template has no
     * script to take an import, so it gets no fix.
     */
    const importAnchor = (member: RuleNode): (Located & Ranged) | undefined => {
      const first = mustFind(source.ast.body.find((entry) => {
        return !isDirective(entry);
      }), 'the first statement past the prologue');
      const firstType: string = first.type;

      if (!firstType.startsWith('Svelte')) {
        return first;
      }

      const chain = [...ancestorsOf(context, member), member];
      const script = chain.findIndex((node) => {
        const type: string = node.type;

        return type === 'SvelteScriptElement';
      });

      return script === -1 ? undefined : chain[script + 1];
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
      const alreadyImported = existing !== undefined && bindsUsably(existing, name, isType);

      // Bound to something else already, so replacing the member access would quietly mean a different value.
      const collides = !alreadyImported && resolveVariable(scope, name) !== null;

      // The list a fix may join, absent for a type-only import and for one with no named specifiers.
      const mergeable = existing !== undefined && existing.importKind !== 'type'
        ? namedSpecifiers(existing)[0]
        : undefined;
      const anchor = importAnchor(member);

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
        if (mergeable === undefined) {
          const before = mustFind(anchor, 'the statement a new import goes before');

          // The statement's own indent after the import, which is none in a script and the body's in a component.
          return [
            fixer.insertTextBeforeRange(
              rangeOf(before),
              `import { ${specifier} } from '${MODULE}';\n\n${getIndent(source, before)}`,
            ),
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
        // No anchor is a reference in Svelte markup, where `Program.body` holds elements and no import is ever found to
        // merge into either, so there is nothing to fix with.
        fix: collides || anchor === undefined ? null : rewrite,
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

        const member = mustFind(opening.property, 'the member of a namespaced JSX tag');

        report(node, mustFind(member.name, 'the name of a namespaced JSX tag'), false, tags.map(rangeOf));
      },

      // `React.createElement`, in a value. A computed access names nothing a fix could import, and is the only way
      // the property of a member expression is not an identifier, so the guard covers both.
      MemberExpression: (node) => {
        if (node.computed || nameOf(node.object) !== NAMESPACE) {
          return;
        }

        report(node, mustFind(nameOf(node.property), 'the name of a namespace member'), false, [rangeOf(node)]);
      },
    };
  },
});
