import {
  createRule,
  mustFind,
  optionsOf,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

interface NoInlineObjectTypesOptions {
  allowIn: string[];
}

interface TypeMember {
  type?: string;
}

interface TypeName {
  name?: string;
  // Set on a qualified name such as `React.PropsWithChildren`, whose last segment is the type.
  right?: TypeName;
}

// Named: this rule holds itself to what it reports.
interface NamedTypeReference {
  typeName: TypeName;
}

interface TypeLiteral {
  members: TypeMember[];
}

// `TSTypeLiteral` is absent from ESLint's ESTree types, so it is narrowed by a predicate.
const hasMembers = (node: RuleNode): node is RuleNode & TypeLiteral => {
  return 'members' in node;
};

// A type literal is never a child of `Program`, so it always has a parent.
const parentTypeOf = (node: RuleNode): string => {
  return mustFind(node.parent).type;
};

const hasTypeName = (node: RuleNode): node is RuleNode & NamedTypeReference => {
  return 'typeName' in node;
};

// `undefined` rather than an empty string, which `allowIn: ['']` would match for every literal outside a generic.
const argumentToOf = (node: RuleNode): string | undefined => {
  const argument = mustFind(node.parent);
  const reference = mustFind(argument.parent);

  return hasTypeName(reference) ? reference.typeName.right?.name ?? reference.typeName.name : undefined;
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
  // Report-only: a generated `Type1` beside the code is worse than the inline shape it replaced.
  create: (context) => {
    const allowIn = new Set<string | undefined>(optionsOf<NoInlineObjectTypesOptions>(context).allowIn);

    return {
      // An untyped selector's parameter must be a supertype of every visitor shape.
      TSTypeLiteral: (node: RuleNode) => {
        // `string & {}` keeps a union of literals open, and there is nothing in it to name.
        if (!hasMembers(node) || node.members.length === 0) {
          return;
        }

        if (parentTypeOf(node) === 'TSTypeAliasDeclaration') {
          return;
        }

        const argumentTo = argumentToOf(node);

        if (allowIn.has(argumentTo)) {
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
