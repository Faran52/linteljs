import { createRule } from '../../types.ts';
import { optionsOf, type RuleNode } from '../../utils/ruleUtils.ts';

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
  return 'members' in node && Array.isArray(node.members);
};

// `String(...)`, because ESLint types `parent` as ESTree and a TypeScript node type genuinely occurs there: comparing
// the union directly is a TS2367 the compiler is right about and the runtime is not.
const parentTypeOf = (node: RuleNode): string => {
  return String(node.parent?.type);
};

const hasTypeName = (node: RuleNode): node is RuleNode & NamedTypeReference => {
  return 'typeName' in node && typeof node.typeName === 'object' && node.typeName !== null;
};

/**
 * The generic this literal is an argument to, or an empty string when it is not an argument at all. `Extract<Node,
 * { type: 'ObjectPattern' }>` reaches here as a literal whose parent is the argument list and whose grandparent is
 * the reference to `Extract`.
 */
const argumentToOf = (node: RuleNode): string => {
  if (parentTypeOf(node) !== 'TSTypeParameterInstantiation') {
    return '';
  }

  const reference = node.parent?.parent;

  if (reference === null || reference === undefined || !hasTypeName(reference)) {
    return '';
  }

  /**
   * A bare `Extract<...>` carries an identifier and a name. A qualified one, `ts.Extract<...>`, carries a
   * `TSQualifiedName` with no `name` at all, and answering the string `undefined` for it would let
   * `allowIn: ['undefined']` switch the rule off by accident.
   */
  const { name } = reference.typeName;

  return typeof name === 'string' ? name : '';
};

export const noInlineObjectTypes = createRule('no-inline-object-types', {
  meta: {
    type: 'problem',
    docs: {
      category: 'types',
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
    const allowIn = optionsOf<NoInlineObjectTypesOptions>(context).allowIn ?? [];

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
        if (allowIn.includes(argumentToOf(node))) {
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
