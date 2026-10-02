import {
  ancestorsOf,
  physicalFilenameOf,
  scopeOf,
  sourceCodeOf,
} from '../../utils/compatUtils.ts';
import { getIndent, type Located } from '../../utils/layoutUtils.ts';
import {
  createRule,
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

import type { AST, Rule } from 'eslint';

// `TSQualifiedName` is absent from ESLint's ESTree types, so it is narrowed by a predicate.
interface Qualified {
  left: NamedNode;
  right: NamedNode;
}

interface ImportSource {
  value?: string;
}

interface ImportSpecifier extends Ranged {
  type: string;
  importKind?: string;
  local: NamedNode;
}

// ESLint's ESTree types carry no `declare`, and typescript-estree puts it on several node types.
interface Ambient {
  declare?: boolean;
}

interface Reach {
  member: RuleNode;
  name: string;
  isType: boolean;
  targets: AST.Range[];
  anchor: (Located & Ranged) | undefined;
  imported: boolean;
  fixable: boolean;
}

// In `import type { ... }` a `type` modifier on a specifier is a syntax error.
interface ImportNode {
  importKind?: string;
  source: ImportSource;
  specifiers: ImportSpecifier[];
}

const namedSpecifiers = (node: ImportNode): ImportSpecifier[] => {
  return node.specifiers
    .filter((specifier) => {
      return specifier.type === 'ImportSpecifier';
    });
};

const NAMESPACE = 'React';

const MODULE = 'react';

const DECLARATION_FILE = /\.d\.[cm]?ts$/;

// `<Fragment>` against a type-only binding is a value TypeScript refuses.
const bindsUsably = (node: ImportNode, name: string, isType: boolean): boolean => {
  return node.specifiers
    .some((specifier) => {
      return specifier.local.name === name
        && (isType || (node.importKind !== 'type' && specifier.importKind !== 'type'));
    });
};

const isAmbient = (node: TypedNode & Ambient): boolean => {
  return node.declare === true;
};

const isQualified = (node: RuleNode): node is RuleNode & Qualified => {
  return 'left' in node;
};

// `TypedNode`: this walks `ast.body`, whose members ESLint types as ESTree statements.
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

    // An import would turn a declaration file into a module, and every global in it would stop being global.
    const filename = physicalFilenameOf(context);

    if (DECLARATION_FILE.test(filename)
      || (source.ast.body.some(isAmbient) && !source.ast.body.some(isImport))) {
      return {};
    }

    const existingImport = (): (TypedNode & ImportNode) | undefined => {
      for (const statement of source.ast.body) {
        if (isImport(statement) && statement.source.value === MODULE) {
          return statement;
        }
      }

      return undefined;
    };

    // After the prologue: `'use client'` stops being a directive once anything precedes it.
    // A reference in Svelte markup has no script to take an import, so it gets no fix.
    const importAnchor = (member: RuleNode): (Located & Ranged) | undefined => {
      const firstStatement = source.ast.body
        .find((entry) => {
          return !isDirective(entry);
        });

      const first = mustFind(firstStatement);
      const firstType: string = first.type;

      if (!firstType.startsWith('Svelte')) {
        return first;
      }

      const chain = [...ancestorsOf(context, member), member];
      const script = chain
        .findIndex((node) => {
          const type: string = node.type;

          return type === 'SvelteScriptElement';
        });

      return script === -1 ? undefined : chain[script + 1];
    };

    const reaches: Reach[] = [];

    const note = (member: RuleNode, name: string, isType: boolean, targets: AST.Range[]): void => {
      const scope = scopeOf(context, member);

      // A local `React` is the file's own binding.
      if (resolveVariable(scope, NAMESPACE) !== null) {
        return;
      }

      const existing = existingImport();
      const imported = existing !== undefined && bindsUsably(existing, name, isType);

      // Bound to something else already, so replacing the member access would quietly mean a different value.
      const collides = !imported && resolveVariable(scope, name) !== null;
      // Only a comment puts a slash between `React` and a name, and the rewrite would drop it.
      const holdsComment = targets
        .some((target) => {
          return source.text
            .slice(...target)
            .includes('/');
        });
      const anchor = importAnchor(member);

      reaches.push({
        member,
        name,
        isType,
        targets,
        anchor,
        imported,
        fixable: !collides && !holdsComment,
      });
    };

    // Every reach an import serves in one fix: a fix each would all edit that import, and ESLint applies one a pass.
    const rewriteAll = (anchor: Located & Ranged, group: Reach[]) => {
      return (fixer: Fixer): ReturnType<Fixer['replaceText']>[] => {
        const targets = new Map<string, [AST.Range, string]>();
        // A name any value reach needs is imported as a value, which serves its type reaches too.
        const typeOnly = new Map<string, boolean>();

        for (const reach of group) {
          for (const target of reach.targets) {
            targets.set(`${String(target[0])}:${String(target[1])}`, [target, reach.name]);
          }

          if (!reach.imported) {
            typeOnly.set(reach.name, (typeOnly.get(reach.name) ?? true) && reach.isType);
          }
        }

        const replaced = [...targets.values()]
          .map(([target, name]) => {
            return fixer.replaceTextRange(target, name);
          });
        const specifiers = [...typeOnly]
          .map(([name, isType]) => {
            return isType ? `type ${name}` : name;
          })
          .join(', ');

        if (specifiers === '') {
          return replaced;
        }

        const existing = existingImport();
        const mergeable = existing !== undefined && existing.importKind !== 'type'
          ? namedSpecifiers(existing)[0]
          : undefined;

        // A second `import { ... } from 'react'` beside these is valid, which rewriting them into one is not.
        if (mergeable === undefined) {
          const anchorRange = rangeOf(anchor);
          const importFix = fixer.insertTextBeforeRange(
            anchorRange,
            `import { ${specifiers} } from '${MODULE}';\n\n${getIndent(source, anchor)}`,
          );
          const withNewImport = [importFix, ...replaced];

          return withNewImport;
        }

        // Rewriting the statement text can write `import * as R, { X } from 'react'`, which does not parse.
        const mergeableRange = rangeOf(mergeable);
        const specifierFix = fixer.insertTextBeforeRange(mergeableRange, `${specifiers}, `);
        const withMergedImport = [specifierFix, ...replaced];

        return withMergedImport;
      };
    };

    const visitors: Rule.RuleListener = {
      'Program:exit': () => {
        const groups = new Map<(Located & Ranged) | undefined, Reach[]>();

        for (const reach of reaches) {
          if (reach.fixable) {
            groups.set(reach.anchor, [...groups.get(reach.anchor) ?? [], reach]);
          }
        }

        for (const {
          member,
          name,
          anchor,
          fixable,
        } of reaches) {
          let fix: Rule.ReportFixer | null = null;

          if (fixable && anchor !== undefined) {
            const group = mustFind(groups.get(anchor));

            fix = rewriteAll(anchor, group);
          }

          context.report({
            node: member,
            messageId: 'globalNamespace',
            data: { name },
            fix,
          });
        }
      },

      'TSQualifiedName': (node: RuleNode) => {
        if (isQualified(node) && node.left.name === NAMESPACE) {
          note(node, node.right.name, true, [rangeOf(node)]);
        }
      },

      // Both tags in one fix: half of that rename does not parse, and ESLint writes whatever the last pass produced.
      'JSXElement': (node: RuleNode) => {
        const tags = globalNamespaceTags(node, NAMESPACE);
        const [opening] = tags;

        if (opening === undefined) {
          return;
        }

        const member = mustFind(opening.property);

        note(node, mustFind(member.name), false, tags.map(rangeOf));
      },

      // A computed access names nothing a fix could import.
      'MemberExpression': (node) => {
        if (node.computed || nameOf(node.object) !== NAMESPACE) {
          return;
        }

        const propertyName = mustFind(nameOf(node.property));

        note(node, propertyName, false, [rangeOf(node)]);
      },
    };

    return visitors;
  },
});
