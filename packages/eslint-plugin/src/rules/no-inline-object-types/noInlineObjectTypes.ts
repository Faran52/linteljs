import { createRule } from '../../types.ts';
import {
  mustFind,
  optionsOf,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

interface NoInlineObjectTypesOptions {
  allowIn: string[];
}

// All this rule reads of a member is that it is there. Named rather than left open, because counting needs no more.
interface TypeMember {
  type?: string;
}

// The name behind `Extract<...>`, which ESTree does not describe either.
interface TypeName {
  name?: string;
}

// What `hasTypeName` narrows to. Named because this rule reports an inline one, and it holds itself to that.
interface NamedTypeReference {
  typeName: TypeName;
}

interface TypeLiteral {
  members: TypeMember[];
}

// `TSTypeLiteral` is absent from ESLint's ESTree types, so the one field this rule reads is described structurally
// and narrowed by a predicate. A real parsed node satisfies it, and no cast is needed to say so.
const hasMembers = (node: RuleNode): node is RuleNode & TypeLiteral => {
  return 'members' in node;
};

// A type literal is never a child of `Program`, so it always has a parent.
const parentTypeOf = (node: RuleNode): string => {
  return mustFind(node.parent, 'the parent of a type literal').type;
};

// Only a `TSTypeReference` carries a `typeName`, and it is always an entity name, so the key alone answers.
const hasTypeName = (node: RuleNode): node is RuleNode & NamedTypeReference => {
  return 'typeName' in node;
};

/**
 * The generic this literal is an argument to, or `undefined` when it is not an argument at all. `Extract<Node,
 * { type: 'ObjectPattern' }>` reaches here as a literal whose parent is the argument list and whose grandparent is
 * the reference to `Extract`. A literal can only sit under a `TSTypeReference` inside its argument list, so the
 * grandparent alone answers. A type literal is never a child of `Program`, so both generations exist.
 *
 * A bare `Extract<...>` carries an identifier and a name. A qualified one, `ts.Extract<...>`, carries a
 * `TSQualifiedName` with no `name` at all, so it answers `undefined` too and no allowance can match it. `undefined`
 * rather than an empty string, which `allowIn: ['']` would have matched for every literal outside a generic.
 */
const argumentToOf = (node: RuleNode): string | undefined => {
  const argument = mustFind(node.parent, 'the parent of a type literal');
  const reference = mustFind(argument.parent, 'the reference a type argument belongs to');

  return hasTypeName(reference) ? reference.typeName.name : undefined;
};

export const noInlineObjectTypes = createRule('no-inline-object-types', {
  meta: {
    type: 'problem',
    docs: {
      language: 'typescript',
      recommended: true,
      description: 'Give an object type a name instead of writing its shape inline.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowIn: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      nameTheType: 'Give this object type a name. An inline shape cannot be referenced, extended or documented.',
    },
  },
  // Report-only. Extracting the shape needs a name and a place to put it, and both are decisions a fixer would have
  // to invent: a generated `Type1` beside the code is worse than the inline shape it replaced.
  create: (context) => {
    // A Set reads an absent option as empty, and takes the `undefined` a literal outside any generic answers.
    const allowIn = new Set<string | undefined>(optionsOf<NoInlineObjectTypesOptions>(context).allowIn);

    return {
      // `RuleNode`, not the TS shape: an untyped selector's parameter must be a supertype of every visitor shape.
      TSTypeLiteral: (node: RuleNode) => {
        // An empty literal is not a shape. `string & {}` is the idiom that keeps a union of string literals open to
        // any other string while an editor still offers the named ones, and there is nothing in it to name.
        if (!hasMembers(node) || node.members.length === 0) {
          return;
        }

        // `type Answers = { ... }` is the named declaration this rule asks for, not an instance of what it forbids.
        if (parentTypeOf(node) === 'TSTypeAliasDeclaration') {
          return;
        }

        // A literal handed to a named generic, where `allowIn` says that generic reads shapes rather than holds them.
        if (allowIn.has(argumentToOf(node))) {
          return;
        }

        context.report({
          node,
          messageId: 'nameTheType',
        });
      },
    };
  },
});
