import { type AstNode, listOf } from '../../utils/astUtils.ts';

import {
  type Build,
  type Candidate,
  fullySplit,
  insertBlankLine,
  joinRange,
  nodesOf,
  pickFirst,
  replaced,
  separatedByPunctuation,
  spansLines,
  splitBraces,
  type State,
  textOf,
} from './editUtils.ts';

const DEFAULT_MAX_ITEMS = 2;
const DEFAULT_MAX_LINE_LENGTH = 120;
const DEFAULT_MAX_PROPERTIES = 2;

const PROBE_ALIAS = 'linteljsProbeAlias';

const namedImports = (node: AstNode): AstNode[] => {
  return (node.specifiers ?? [])
    .filter((specifier) => {
      return specifier.type === 'ImportSpecifier';
    });
};

const oneLine = (node: AstNode): boolean => {
  return node.loc.start.line === node.loc.end.line;
};

const importCase = (build: (node: AstNode, named: AstNode[], state: State) => Candidate | undefined): Build => {
  return (state) => {
    return pickFirst(nodesOf(state, 'ImportDeclaration'), (node) => {
      return build(node, namedImports(node), state);
    });
  };
};

export const importJoinedCase = importCase((node, named, state) => {
  return named.length <= DEFAULT_MAX_ITEMS || oneLine(node)
    ? undefined
    : joinRange(state, node.range[0], node.range[1]);
});

export const importSplitCase = importCase((node, named, state) => {
  return named.length === 0 || named.length > DEFAULT_MAX_ITEMS || !oneLine(node)
    ? undefined
    : splitBraces(state, named);
});

export const importLongLineCase = importCase((node, named, state) => {
  const end = node.source?.range[1];
  const needed = DEFAULT_MAX_LINE_LENGTH + 1 - node.loc.start.column - textOf(state, node).length;

  if (named.length === 0 || !oneLine(node) || needed <= 0 || end === undefined) {
    return undefined;
  }

  return /['"]/.test(state.source[end - 1] ?? '') ? replaced(state, end - 1, end - 1, 'x'.repeat(needed)) : undefined;
});

export const importTailJoinedCase = importCase((_, named, state) => {
  const [previous, last] = named.slice(-2);

  return named.length < 3 || !fullySplit(named) || previous === undefined || last === undefined
    ? undefined
    : joinRange(state, previous.range[1], last.range[0]);
});

export const importBlankLineCase = importCase((_, named, state) => {
  const [first, second] = named;

  return first === undefined || second === undefined || !fullySplit(named)
    ? undefined
    : insertBlankLine(state, first, second);
});

export const patternJoinedCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'ObjectPattern'), (node) => {
    const properties = node.properties ?? [];
    const [first] = properties;
    const last = properties.at(-1);

    if (properties.length <= DEFAULT_MAX_PROPERTIES || first === undefined || last === undefined
      || !spansLines(first, last)) {
      return undefined;
    }

    return joinRange(state, node.range[0], node.range[1]);
  });
};

export const patternBlankLineCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'ObjectPattern'), (node) => {
    const properties = node.properties ?? [];
    const [first, second] = properties;

    return properties.length <= DEFAULT_MAX_PROPERTIES || !fullySplit(properties) || !first || !second
      ? undefined
      : insertBlankLine(state, first, second);
  });
};

export const typeMembersJoinedCase = (type: string, read: (node: AstNode) => AstNode[]): Build => {
  return (state) => {
    return pickFirst(nodesOf(state, type), (node) => {
      const members = read(node);
      const [first] = members;
      const last = members.at(-1);

      if (members.length <= DEFAULT_MAX_PROPERTIES || !first || !last || !spansLines(first, last)) {
        return undefined;
      }

      if (!separatedByPunctuation(state, members)) {
        state.skip('members separated by newlines alone, so joining them would not parse');

        return undefined;
      }

      return joinRange(state, node.range[0], node.range[1]);
    });
  };
};

export const interfaceMembers = (node: AstNode): AstNode[] => {
  return listOf(node.body);
};

export const literalMembers = (node: AstNode): AstNode[] => {
  return node.members ?? [];
};

// Array holes are out: a hole has no tokens to measure.
export const patternGapCase = (type: string, fromStart: boolean): Build => {
  return (state) => {
    return pickFirst(nodesOf(state, type), (node) => {
      const raw = node.properties ?? node.elements ?? [];
      const members = raw
        .filter((member) => {
          return member !== null;
        });
      const index = fromStart ? 1 : members.length - 1;
      const [previous, current] = [members[index - 1], members[index]];

      if (members.length < 3 || members.length !== raw.length || !fullySplit(members) || !previous || !current) {
        return undefined;
      }

      return joinRange(state, previous.range[1], current.range[0]);
    });
  };
};

export const exportJoinedCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'ExportNamedDeclaration'), (node) => {
    const specifiers = node.specifiers ?? [];
    const [first] = specifiers;
    const last = specifiers.at(-1);

    return specifiers.length < 3 || !first || !last || !spansLines(first, last)
      ? undefined
      : joinRange(state, first.range[0], last.range[1]);
  });
};

const exportKindOf = (node: AstNode): string => {
  if (node.exportKind === 'type') {
    return 'type';
  }

  return node.source ? 'from' : 'local';
};

// Re-exporting the same local under new names is legal in all three forms. Two make a list of three.
export const exportTripleCase = (kind: string): Build => {
  return (state) => {
    if (state.source.includes(PROBE_ALIAS)) {
      return undefined;
    }

    return pickFirst(nodesOf(state, 'ExportNamedDeclaration'), (node) => {
      const [only] = node.specifiers ?? [];
      const local = only?.local;

      // `export { default }` needs a `from`, and the keyword cannot be aliased into a local binding.
      if (node.specifiers?.length !== 1 || exportKindOf(node) !== kind || !only || local?.type !== 'Identifier'
        || local.name === undefined || local.name === 'default') {
        return undefined;
      }

      const added = `, ${local.name} as ${PROBE_ALIAS}, ${local.name} as ${PROBE_ALIAS}Two`;

      return replaced(state, only.range[1], only.range[1], added);
    });
  };
};

// A bare `extends` accepts no union, and an array or indexed-access parent would take the member with it.
const UNION_SAFE_PARENTS = new Set([
  'TSTypeAliasDeclaration',
  'TSTypeAnnotation',
  'TSTypeParameterInstantiation',
]);

const PLAIN_TYPES = new Set([
  'TSBooleanKeyword',
  'TSLiteralType',
  'TSNumberKeyword',
  'TSStringKeyword',
  'TSTypeReference',
]);

// Parenthesised because a function type is not legal bare in a union; typescript-eslint elides them.
export const unionWithMemberCase = (member: string): Build => {
  return (state) => {
    const candidates = [...PLAIN_TYPES]
      .flatMap((type) => {
        return nodesOf(state, type);
      });

    return pickFirst(candidates, (node) => {
      return UNION_SAFE_PARENTS.has(node.parent?.type ?? '')
        ? replaced(state, node.range[0], node.range[1], `${textOf(state, node)} | ${member}`)
        : undefined;
    });
  };
};

export const unionGenericCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'TSTypeParameterInstantiation'), (node) => {
    const [first] = node.params ?? [];

    if (!first || !PLAIN_TYPES.has(first.type) || spansLines(first, first)) {
      return undefined;
    }

    return replaced(state, first.range[0], first.range[1],
      `${textOf(state, first)} | 'linteljsProbeB' | 'linteljsProbeC' | 'linteljsProbeD'`);
  });
};

const TYPE_DECLARATIONS = new Set(['TSInterfaceDeclaration', 'TSTypeAliasDeclaration']);

const isTypeDeclaration = (node: AstNode): boolean => {
  return TYPE_DECLARATIONS.has(node.type)
    || (node.type === 'ExportNamedDeclaration' && TYPE_DECLARATIONS.has(node.declaration?.type ?? ''));
};

// typescript-eslint leaves `directive` undefined on a statement that is not one, so the value decides.
const isDirective = (node: AstNode): boolean => {
  return node.type === 'ExpressionStatement' && node.directive !== undefined;
};

const isHeader = (node: AstNode): boolean => {
  return node.type === 'ImportDeclaration' || isDirective(node);
};

const relocateType = (state: State, node: AstNode): Candidate | undefined => {
  const from = state.source.lastIndexOf('\n', node.range[0] - 1) + 1;
  const lineEnd = state.source.indexOf('\n', node.range[1]);
  const to = lineEnd === -1 ? state.source.length : lineEnd + 1;

  if (state.source
    .slice(from, node.range[0])
    .trim() !== '') {
    state.skip('type declaration shares its opening line with other code');

    return undefined;
  }

  const text = state.source
    .slice(node.range[0], to)
    .trimEnd();
  const kept = `${state.source.slice(0, from)}${state.source.slice(to)}`.trimEnd();

  return {
    source: `${kept}\n\n${text}\n`,
    offset: kept.length + 2,
  };
};

const headerKindOf = (body: AstNode[]): string => {
  if (body
    .some((entry) => {
      return entry.type === 'ImportDeclaration';
    })) {
    return 'imports';
  }

  return body.some(isDirective) ? 'directive' : 'none';
};

// A prologue with no imports is too rare to rely on the corpus for.
const DIRECTIVE = "'use strict';\n\n";

export const typeBelowRuntimeCase = (header: string): Build => {
  return (state) => {
    const { body } = state.ast;
    const hasRuntime = body
      .some((entry) => {
        return !isHeader(entry) && !isTypeDeclaration(entry);
      });

    if (headerKindOf(body) !== (header === 'directive' ? 'none' : header) || !hasRuntime) {
      return undefined;
    }

    const moved = pickFirst(body.filter(isTypeDeclaration), (node) => {
      return relocateType(state, node);
    });

    return moved === undefined || header !== 'directive'
      ? moved
      : {
          offset: moved.offset + DIRECTIVE.length,
          source: DIRECTIVE + moved.source,
        };
  };
};
