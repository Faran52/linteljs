import {
  type AstNode,
  listOf,
  nodeOf,
} from '../../utils/astUtils.ts';
import { countMatches } from '../../utils/corpusUtils.ts';

import {
  type Build,
  type Candidate,
  climb,
  commentsIn,
  escapeName,
  FUNCTION_TYPES,
  nodesOf,
  pickFirst,
  replaced,
  type State,
  textOf,
  unsafeToReflow,
} from './editUtils.ts';

interface ArrowDeclaration {
  arrow: AstNode;
  name: string;
}

interface Dependencies {
  array: AstNode;
  names: string[];
}

interface Edit {
  from: number;
  to: number;
  text: string;
}

// One already in the file means it is not a clean slate.
const PROBE_BINDING = 'linteljsNamespaceProbe';
const PROBE_PROPS = 'linteljsProbeProps';

export const PROBE_HANDLER = 'linteljsRejectionProbe';
export const DEFAULT_HOOKS = [
  'useEffect',
  'useCallback',
  'useMemo',
];

// The only way to exercise the `hooks` option on real code.
export const EXTRA_HOOKS = ['useLayoutEffect', 'useImperativeHandle'];

// Textual and over-skipping: a lost candidate costs nothing.
const ARROW_HAZARDS = /\b(?:this|arguments|super|asserts)\b|new\s*\.\s*target/;

const STATEMENT_PARENTS = new Set([
  'Program',
  'BlockStatement',
  'ExportNamedDeclaration',
]);

const isBlockArrow = (node: AstNode | null | undefined): node is AstNode => {
  return node?.type === 'ArrowFunctionExpression' && nodeOf(node.body)?.type === 'BlockStatement';
};

// The rule stays silent on `new f()`, `f.prototype` and reassignment.
const arrowNameIsFunctionOnly = (state: State, name: string): boolean => {
  const escaped = escapeName(name);

  return new RegExp(String.raw`new\s+${escaped}\b|\b${escaped}\s*\.\s*prototype\b`).test(state.source)
    || countMatches(state.source, new RegExp(String.raw`\b${escaped}\s*=(?!=)`, 'g')) > 1;
};

const writeFunction = (state: State, arrow: AstNode, head: string): string => {
  const body = nodeOf(arrow.body);
  const params = (arrow.params ?? [])
    .map((param) => {
      return textOf(state, param);
    })
    .join(', ');
  const returnType = arrow.returnType ? textOf(state, arrow.returnType) : '';

  return `${arrow.async === true ? 'async ' : ''}${head}(${params})${returnType} ${body ? textOf(state, body) : ''}`;
};

const arrowBodySkipReason = (state: State, arrow: AstNode, from: number): string | undefined => {
  const body = nodeOf(arrow.body);

  if (body?.type !== 'BlockStatement') {
    return undefined;
  }

  if (arrow.typeParameters) {
    return 'arrow carries type parameters, which the rebuild does not reproduce';
  }

  if (ARROW_HAZARDS.test(textOf(state, arrow))) {
    return 'body uses this/arguments/super/new.target, which the rule declines';
  }

  return commentsIn(state, from, body.range[0])
    ? 'comment outside the body, which the rebuild cannot carry'
    : undefined;
};

const arrowDeclarationOf = (node: AstNode): ArrowDeclaration | undefined => {
  const [declarator] = node.declarations ?? [];
  const id = declarator?.id;
  const arrow = declarator?.init;

  if (node.kind !== 'const' || node.declarations?.length !== 1 || id?.type !== 'Identifier' || id.typeAnnotation
    || id.name === undefined || !isBlockArrow(arrow) || arrow.typeParameters) {
    return undefined;
  }

  return {
    arrow,
    name: id.name,
  };
};

const skipped = (state: State, reason: string | undefined): boolean => {
  if (reason !== undefined) {
    state.skip(reason);
  }

  return reason !== undefined;
};

const declarationSkipReason = (state: State, node: AstNode, found: ArrowDeclaration): string | undefined => {
  if (!STATEMENT_PARENTS.has(node.parent?.type ?? '')) {
    return 'arrow sits where a function declaration is not a statement';
  }

  if (!textOf(state, node).endsWith(';')) {
    return 'declaration has no semicolon, so the rewrite risks a continuation';
  }

  return arrowBodySkipReason(state, found.arrow, node.range[0])
    ?? (arrowNameIsFunctionOnly(state, found.name)
      ? 'name is constructed, reassigned or carries a prototype'
      : undefined);
};

export const functionDeclarationCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'VariableDeclaration'), (node) => {
    const found = arrowDeclarationOf(node);

    return !found || skipped(state, declarationSkipReason(state, node, found))
      ? undefined
      : replaced(state, node.range[0], node.range[1], writeFunction(state, found.arrow, `function ${found.name}`));
  });
};

export const functionExpressionCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'VariableDeclaration'), (node) => {
    const found = arrowDeclarationOf(node);

    return !found || skipped(state, arrowBodySkipReason(state, found.arrow, found.arrow.range[0]))
      ? undefined
      : replaced(state, found.arrow.range[0], found.arrow.range[1], writeFunction(state, found.arrow, 'function '));
  });
};

const objectArrowProperty = (node: AstNode): AstNode | undefined => {
  const arrow = nodeOf(node.value);

  return node.kind !== 'init' || node.method === true || node.computed === true || !isBlockArrow(arrow)
    || arrow.typeParameters
    ? undefined
    : arrow;
};

// The key sits outside the function's range, so shorthand replaces the whole property.
export const propertyFunctionCase = (asMethod: boolean): Build => {
  return (state) => {
    return pickFirst(nodesOf(state, 'Property'), (node) => {
      const arrow = objectArrowProperty(node);

      if (!arrow || !node.key || skipped(state, arrowBodySkipReason(state, arrow, node.range[0]))) {
        return undefined;
      }

      return asMethod
        ? replaced(state, node.range[0], node.range[1], writeFunction(state, arrow, textOf(state, node.key)))
        : replaced(state, arrow.range[0], arrow.range[1], writeFunction(state, arrow, 'function '));
    });
  };
};

export const defaultExportFunctionCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'ExportDefaultDeclaration'), (node) => {
    const arrow = node.declaration;

    return !isBlockArrow(arrow) || skipped(state, arrowBodySkipReason(state, arrow, arrow.range[0]))
      ? undefined
      : replaced(state, arrow.range[0], arrow.range[1], writeFunction(state, arrow, 'function '));
  });
};

// Parenthesised so an object literal keeps its meaning.
export const expressionBodyCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'ArrowFunctionExpression'), (node) => {
    const body = nodeOf(node.body);
    const statements = listOf(body?.body);
    const argument = statements[0]?.type === 'ReturnStatement' ? statements[0].argument : undefined;

    if (body?.type !== 'BlockStatement' || statements.length !== 1 || !argument) {
      return undefined;
    }

    if (ARROW_HAZARDS.test(textOf(state, node))) {
      state.skip('body uses this/arguments/super, which the rule declines');

      return undefined;
    }

    if (commentsIn(state, body.range[0], body.range[1])) {
      state.skip('comment inside the body, which the collapse cannot carry');

      return undefined;
    }

    return replaced(state, body.range[0], body.range[1], `(${textOf(state, argument)})`);
  });
};

const inFunction = (node: AstNode): AstNode | undefined => {
  return climb(node, (ancestor) => {
    return FUNCTION_TYPES.has(ancestor.type);
  });
};

const awaitGapIsClean = (state: State, node: AstNode, argument: AstNode): boolean => {
  if (state.source
    .slice(node.range[0] + 'await'.length, argument.range[0])
    .trim() === '') {
    return true;
  }

  state.skip('comment between `await` and its operand');

  return false;
};

// Nothing awaits or returns it, so this rule rather than `prefer-try-catch` is on the hook.
export const detachedHandlerCase = (method: string): Build => {
  return (state) => {
    return pickFirst(nodesOf(state, 'ExpressionStatement'), (node) => {
      const awaited = nodeOf(node.expression);
      const argument = awaited?.argument;

      if (awaited?.type !== 'AwaitExpression' || !argument || !textOf(state, node).endsWith(';')) {
        return undefined;
      }

      if (!inFunction(node)) {
        state.skip('await at module top level, which the rule exempts');

        return undefined;
      }

      if (climb(node, (ancestor) => {
        return ancestor.type === 'MethodDefinition' && ancestor.kind === 'constructor';
      })) {
        state.skip('await inside a constructor, which the rule exempts');

        return undefined;
      }

      return awaitGapIsClean(state, awaited, argument)
        ? replaced(state, awaited.range[0], awaited.range[1], `(${textOf(state, argument)}).${method}(() => {})`)
        : undefined;
    });
  };
};

export const strictAwaitedHandlerCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'AwaitExpression'), (node) => {
    const { argument } = node;

    if (!argument) {
      return undefined;
    }

    if (!inFunction(node)) {
      state.skip('await at module top level, which the rule exempts under strict too');

      return undefined;
    }

    return awaitGapIsClean(state, node, argument)
      ? replaced(state, argument.range[0], argument.range[1], `(${textOf(state, argument)}).then(() => {})`)
      : undefined;
  });
};

// Unpicking a real `try`/`catch` would mean choosing the handler's statements, so the edit goes this way only.
export const awaitedHandlerCase = (suffix: string): Build => {
  return (state) => {
    return pickFirst(nodesOf(state, 'AwaitExpression'), (node) => {
      const { argument } = node;

      return argument && awaitGapIsClean(state, node, argument)
        ? replaced(state, node.range[0], node.range[1], `await (${textOf(state, argument)})${suffix}`)
        : undefined;
    });
  };
};

export const asyncReturnHandlerCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'ReturnStatement'), (node) => {
    const { argument } = node;

    if (!argument || inFunction(node)?.async !== true) {
      return undefined;
    }

    if (commentsIn(state, node.range[0], argument.range[0])) {
      state.skip('comment between `return` and its argument');

      return undefined;
    }

    return replaced(state, argument.range[0], argument.range[1],
      `(${textOf(state, argument)}).catch(${PROBE_HANDLER})`);
  });
};

// Textual and over-skipping: `const [monaco, setMonaco]` was once reported as a rule defect.
const shadowsName = (state: State, node: AstNode, name: string): boolean => {
  const escaped = escapeName(name);
  const declares = new RegExp(String.raw`\b(?:const|let|var|function|class)\b[^;=]*\b${escaped}\b`);
  const named = new RegExp(String.raw`\b${escaped}\b`);

  for (let current: AstNode | undefined = node; current && current.type !== 'Program'; current = current.parent) {
    if (declares.test(textOf(state, current)) || (current.params ?? [])
      .some((param) => {
        return named.test(textOf(state, param));
      })) {
      return true;
    }
  }

  return false;
};

const namespaceImportOf = (node: AstNode): AstNode | undefined => {
  return node.parent?.type === 'Program'
    ? node.specifiers
        ?.find((specifier) => {
          return specifier.type === 'ImportNamespaceSpecifier';
        })
    : undefined;
};

// Three depths: the ported rule resolved names in the immediate scope only.
export const namespaceDestructureCase = (place: 'block' | 'function' | 'module'): Build => {
  return (state) => {
    if (state.source.includes(PROBE_BINDING)) {
      return undefined;
    }

    const namespace = pickFirst(nodesOf(state, 'ImportDeclaration'), namespaceImportOf);
    const name = namespace?.local?.name;
    const statement = namespace?.parent;

    if (!namespace || name === undefined || !statement) {
      return undefined;
    }

    const line = `\nconst { ${PROBE_BINDING} } = ${name};`;

    if (place === 'module') {
      return replaced(state, statement.range[1], statement.range[1], line);
    }

    const host = pickFirst(nodesOf(state, place === 'function' ? 'FunctionDeclaration' : 'BlockStatement'), (node) => {
      const block = place === 'function' ? nodeOf(node.body) : node;

      // A function's own block is reached through the function, so the block case must not take it again.
      if (block?.type !== 'BlockStatement' || block.range[0] < namespace.range[1]
        || (place === 'block' && FUNCTION_TYPES.has(node.parent?.type ?? ''))) {
        return undefined;
      }

      return shadowsName(state, node, name) ? undefined : block;
    });

    return host ? replaced(state, host.range[0] + 1, host.range[0] + 1, line) : undefined;
  };
};

// Written out rather than imported: a check sharing the code it checks agrees with its bugs.
const compareNames = (left: string, right: string): number => {
  return left.localeCompare(right, 'en', { numeric: true });
};

const dependencyNames = (node: AstNode, hooks: string[]): Dependencies | undefined => {
  const last = node.arguments?.at(-1);
  const elements = last?.elements ?? [];
  const names = elements
    .flatMap((element) => {
      return element?.type === 'Identifier' && element.name !== undefined ? [element.name] : [];
    });

  if (node.callee?.type !== 'Identifier' || !hooks.includes(node.callee.name ?? '') || last?.type !== 'ArrayExpression'
    || elements.length < 2 || names.length !== elements.length) {
    return undefined;
  }

  return {
    array: last,
    names,
  };
};

// Not reversed: a reversed array can land sorted by accident.
export const hookOrderCase = (hooks: string[], wanted: 'asc' | 'desc'): Build => {
  return (state) => {
    return pickFirst(nodesOf(state, 'CallExpression'), (node) => {
      const found = dependencyNames(node, hooks);

      if (!found) {
        return undefined;
      }

      const sorted = [...found.names].sort(compareNames);
      const target = wanted === 'asc' ? sorted : sorted.toReversed();

      if (target.join() === found.names.join()) {
        state.skip('dependency array is already in the order the edit would write');

        return undefined;
      }

      return skipped(state, unsafeToReflow(state, found.array.range[0], found.array.range[1]))
        ? undefined
        : replaced(state, found.array.range[0], found.array.range[1], `[${target.join(', ')}]`);
    });
  };
};

const propsPatternNames = (pattern: AstNode | undefined): string[] | undefined => {
  const properties = pattern?.type === 'ObjectPattern' ? pattern.properties ?? [] : [];
  const names = properties
    .flatMap((property) => {
      const value = nodeOf(property.value);

      return property.type === 'Property' && property.computed !== true && property.shorthand === true
        && value?.type === 'Identifier' && value.name !== undefined
        ? [value.name]
        : [];
    });

  return properties.length > 0 && names.length === properties.length ? names : undefined;
};

const isDeclaringUse = (node: AstNode): boolean => {
  const { parent } = node;

  switch (parent?.type) {
    case 'VariableDeclarator':
    case 'ClassDeclaration':
    case 'ClassExpression': {
      return parent.id === node;
    }

    case 'ArrayPattern': {
      return parent.elements?.includes(node) ?? false;
    }

    case 'RestElement': {
      return parent.argument === node;
    }

    case 'AssignmentPattern': {
      return parent.left === node;
    }

    case 'CatchClause': {
      return parent.param === node;
    }

    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression': {
      return parent.id === node || (parent.params?.includes(node) ?? false);
    }

    case 'ImportSpecifier':
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier': {
      return parent.local === node;
    }

    case 'Property': {
      return parent.value === node && parent.parent?.type === 'ObjectPattern';
    }

    default: {
      return false;
    }
  }
};

// `{ alpha }` would become `{ props.alpha }`, which does not parse.
const isObjectShorthandValue = (node: AstNode): boolean => {
  const { parent } = node;

  return parent?.type === 'Property' && parent.shorthand === true && parent.value === node
    && parent.parent?.type === 'ObjectExpression';
};

const KEYED = new Set([
  'Property',
  'PropertyDefinition',
  'MethodDefinition',
  'TSPropertySignature',
  'TSMethodSignature',
]);

const isNonReference = (node: AstNode): boolean => {
  const { parent } = node;

  if (!parent) {
    return false;
  }

  return (KEYED.has(parent.type) && parent.key === node && parent.computed !== true)
    || (parent.type === 'MemberExpression' && parent.property === node && parent.computed !== true)
    || ([
      'LabeledStatement',
      'BreakStatement',
      'ContinueStatement',
    ].includes(parent.type) && parent.label === node);
};

// The destructured names are the ground truth, so no scope analysis is needed.
const componentPropsRewrite = (state: State, fn: AstNode, names: string[]): Candidate | undefined => {
  const body = nodeOf(fn.body);
  const [firstParam] = fn.params ?? [];

  if (state.source.includes(PROBE_PROPS) || !body || !firstParam) {
    return undefined;
  }

  if (nodesOf(state, 'ExportSpecifier')
    .some((specifier) => {
      return names.includes(specifier.local?.name ?? '') || names.includes(specifier.exported?.name ?? '');
    })) {
    state.skip('a prop name is also an export specifier');

    return undefined;
  }

  const candidates = nodesOf(state, 'Identifier')
    .filter((node) => {
      return names.includes(node.name ?? '') && node.range[0] >= body.range[0] && node.range[1] <= body.range[1];
    });

  const offending = candidates
    .find((node) => {
      return isDeclaringUse(node) || isObjectShorthandValue(node);
    });

  if (offending) {
    state.skip(isDeclaringUse(offending)
      ? 'a prop name is redeclared or shadowed inside the function'
      : 'a prop name is used as an object-literal shorthand value');

    return undefined;
  }

  const references = candidates
    .filter((node) => {
      return !isNonReference(node);
    });

  if (references.length === 0) {
    return undefined;
  }

  const base = fn.range[0];
  const edits: Edit[] = [
    {
      from: firstParam.range[0] - base,
      to: firstParam.range[1] - base,
      text: PROBE_PROPS,
    },
    ...references
      .map((node) => {
        return {
          from: node.range[0] - base,
          to: node.range[1] - base,
          text: `${PROBE_PROPS}.${node.name ?? ''}`,
        };
      }),
  ]
    .sort((left, right) => {
      return right.from - left.from;
    });

  const rewritten = edits
    .reduce((text, edit) => {
      return text.slice(0, edit.from) + edit.text + text.slice(edit.to);
    }, textOf(state, fn));

  return replaced(state, fn.range[0], fn.range[1], rewritten);
};

export const arrowComponentCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'VariableDeclarator'), (node) => {
    const { id, init } = node;
    const names = init?.type === 'ArrowFunctionExpression' ? propsPatternNames(init.params?.[0]) : undefined;

    return id?.type === 'Identifier' && /^[A-Z]/.test(id.name ?? '') && init && names
      ? componentPropsRewrite(state, init, names)
      : undefined;
  });
};

export const functionDeclarationComponentCase: Build = (state) => {
  return pickFirst(nodesOf(state, 'FunctionDeclaration'), (node) => {
    const names = propsPatternNames(node.params?.[0]);

    return /^[A-Z]/.test(node.id?.name ?? '') && names ? componentPropsRewrite(state, node, names) : undefined;
  });
};
