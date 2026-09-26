import { listOf } from '../../utils/astUtils.ts';

import {
  fullySplit,
  insertBlankLine,
  joinRange,
  nodesOf,
  pickFirst,
  replaced,
  separatedByPunctuation,
  spansLines,
  splitBraces,
  textOf,
} from './editUtils.ts';

import type { AstNode } from '../../utils/astUtils.ts';
import type {
  Build,
  Candidate,
  State,
} from './editUtils.ts';

// The defaults the rules ship, which these edits have to cross.
const DEFAULT_MAX_ITEMS = 2;
const DEFAULT_MAX_LINE_LENGTH = 120;
const DEFAULT_MAX_PROPERTIES = 2;

const PROBE_ALIAS = 'linteljsProbeAlias';

const namedImports = (node: AstNode): AstNode[] => {
  return (node.specifiers ?? []).filter((specifier) => {
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

// A compliant multiline import over `maxItems`, joined onto one line.
export const importJoinedCase = importCase((node, named, state) => {
  return named.length <= DEFAULT_MAX_ITEMS || oneLine(node)
    ? undefined
    : joinRange(state, node.range[0], node.range[1]);
});

// A short one-line import split one per line: the direction the joining cases never reach.
export const importSplitCase = importCase((node, named, state) => {
  return named.length === 0 || named.length > DEFAULT_MAX_ITEMS || !oneLine(node)
    ? undefined
    : splitBraces(state, named);
});

// Padded past `maxLineLength` inside the module specifier's quotes, reaching the length trigger alone.
export const importLongLineCase = importCase((node, named, state) => {
  const end = node.source?.range[1];
  const needed = DEFAULT_MAX_LINE_LENGTH + 1 - node.loc.start.column - textOf(state, node).length;

  if (named.length === 0 || !oneLine(node) || needed <= 0 || end === undefined) {
    return undefined;
  }

  return /['"]/.test(state.source[end - 1] ?? '') ? replaced(state, end - 1, end - 1, 'x'.repeat(needed)) : undefined;
});

// The last two members of a split import brought onto one line.
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

const hasRest = (properties: AstNode[]): boolean => {
  return properties.some((property) => {
    return property.type === 'RestElement';
  });
};

// Over the threshold on one line is `mustSplit` unconditionally. A rest element drops the threshold to one.
export const patternJoinedCase = (withRest: boolean): Build => {
  return (state) => {
    return pickFirst(nodesOf(state, 'ObjectPattern'), (node) => {
      const properties = node.properties ?? [];
      const [first] = properties;
      const last = properties.at(-1);
      const rest = hasRest(properties);

      if (rest !== withRest || properties.length <= (rest ? 1 : DEFAULT_MAX_PROPERTIES)
        || first === undefined || last === undefined || !spansLines(first, last)) {
        return undefined;
      }

      return joinRange(state, node.range[0], node.range[1]);
    });
  };
};

// At the threshold the rule wants one line, so splitting lands on the opposite branch.
export const patternSplitCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'ObjectPattern'), (node) => {
    const properties = node.properties ?? [];
    const [first, second] = properties;

    if (properties.length !== DEFAULT_MAX_PROPERTIES || hasRest(properties)
      || first === undefined || second === undefined || spansLines(first, second)) {
      return undefined;
    }

    return splitBraces(state, properties);
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

// An interface body or type literal joined: one predicate in the rule, two visitors the patterns never reach.
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

// One gap closed in an otherwise one-per-line pattern. The rule allows a pattern wholly on one line, so only the
// half-wrapped shape is a case. Array holes are out: a hole has no tokens to measure.
export const patternGapCase = (type: string, fromStart: boolean): Build => {
  return (state) => {
    return pickFirst(nodesOf(state, type), (node) => {
      const raw = node.properties ?? node.elements ?? [];
      const members = raw.filter((member) => {
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

    return specifiers.length < 2 || !first || !last || !spansLines(first, last)
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

// A second specifier beside a lone one: re-exporting the same local under a new name is legal in all three forms.
export const exportPairCase = (kind: string): Build => {
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

      return replaced(state, only.range[1], only.range[1], `, ${local.name} as ${PROBE_ALIAS}`);
    });
  };
};

// A bare `extends` accepts no union, and an array or indexed-access parent would take the member with it.
const UNION_SAFE_PARENTS = new Set(['TSTypeAliasDeclaration', 'TSTypeAnnotation', 'TSTypeParameterInstantiation']);

// Members that are no reason to split, so the union reports for the reason the shape says.
const PLAIN_TYPES = new Set([
  'TSBooleanKeyword',
  'TSLiteralType',
  'TSNumberKeyword',
  'TSStringKeyword',
  'TSTypeReference',
]);

/**
 * A plain type widened by one member the rule always splits on. The member is written rather than found, since a
 * corpus cannot be relied on for a mapped type, and parenthesised because a function type is not legal bare in a
 * union; typescript-eslint elides the parentheses, so the rule sees the member itself.
 */
export const unionWithMemberCase = (member: string): Build => {
  return (state) => {
    return pickFirst([...PLAIN_TYPES].flatMap((type) => {
      return nodesOf(state, type);
    }), (node) => {
      return UNION_SAFE_PARENTS.has(node.parent?.type ?? '')
        ? replaced(state, node.range[0], node.range[1], `${textOf(state, node)} | ${member}`)
        : undefined;
    });
  };
};

// A generic argument widened to four plain members, one over `maxGenericMembers`.
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

// Whole lines move, so the edit cannot leave half a line behind.
const relocateType = (state: State, node: AstNode): Candidate | undefined => {
  const from = state.source.lastIndexOf('\n', node.range[0] - 1) + 1;
  const lineEnd = state.source.indexOf('\n', node.range[1]);
  const to = lineEnd === -1 ? state.source.length : lineEnd + 1;

  if (state.source.slice(from, node.range[0]).trim() !== '') {
    state.skip('type declaration shares its opening line with other code');

    return undefined;
  }

  const text = state.source.slice(node.range[0], to).trimEnd();
  const kept = `${state.source.slice(0, from)}${state.source.slice(to)}`.trimEnd();

  return {
    source: `${kept}\n\n${text}\n`,
    offset: kept.length + 2,
  };
};

// Where the fix puts the moved block back: after imports, after a directive prologue, or at the top.
const headerKindOf = (body: AstNode[]): string => {
  if (body.some((entry) => {
    return entry.type === 'ImportDeclaration';
  })) {
    return 'imports';
  }

  return body.some(isDirective) ? 'directive' : 'none';
};

// A prologue with no imports is too rare to rely on the corpus for, so the directive shape writes its own.
const DIRECTIVE = "'use strict';\n\n";

export const typeBelowRuntimeCase = (header: string): Build => {
  return (state) => {
    const { body } = state.ast;
    const hasRuntime = body.some((entry) => {
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
