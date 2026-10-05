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

interface BlockArrow extends AstNode {
  body: AstNode;
}

interface Named extends AstNode {
  name: string;
}

interface ArrowDeclaration {
  arrow: BlockArrow;
  name: string;
}

type DeclarationStep<T> = (state: State, node: AstNode, found: ArrowDeclaration) => T;

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

const STATEMENT_PARENTS = new Set<string | undefined>([
  'Program',
  'BlockStatement',
  'ExportNamedDeclaration',
]);

const isBlockArrow = (node: AstNode | null | undefined): node is BlockArrow => {
  return node?.type === 'ArrowFunctionExpression' && nodeOf(node.body)?.type === 'BlockStatement';
};

// The rule stays silent on `new f()`, `f.prototype` and reassignment.
const arrowNameIsFunctionOnly = (state: State, name: string): boolean => {
  const escaped = escapeName(name);
  const assignment = new RegExp(String.raw`\b${escaped}\s*=(?!=)`, 'g');

  return new RegExp(String.raw`new\s+${escaped}\b|\b${escaped}\s*\.\s*prototype\b`).test(state.source)
    || countMatches(state.source, assignment) > 1;
};

const writeFunction = (state: State, arrow: BlockArrow, head: string): string => {
  const params = listOf(arrow.params)
    .map((param) => {
      return textOf(state, param);
    })
    .join(', ');
  const returnType = arrow.returnType ? textOf(state, arrow.returnType) : '';

  return `${arrow.async === true ? 'async ' : ''}${head}(${params})${returnType} ${textOf(state, arrow.body)}`;
};

const arrowBodySkipReason = (state: State, arrow: BlockArrow, from: number): string | undefined => {
  if (arrow.typeParameters) {
    return 'arrow carries type parameters, which the rebuild does not reproduce';
  }

  const arrowText = textOf(state, arrow);

  if (ARROW_HAZARDS.test(arrowText)) {
    return 'body uses this/arguments/super/new.target, which the rule declines';
  }

  return commentsIn(state, from, arrow.body.range[0])
    ? 'comment outside the body, which the rebuild cannot carry'
    : undefined;
};

const arrowDeclarationOf = (node: AstNode): ArrowDeclaration | undefined => {
  const [declarator] = listOf(node.declarations);
  const id = declarator?.id;
  const arrow = declarator?.init;

  const isSingleConst = node.kind === 'const' && node.declarations?.length === 1;

  if (!isSingleConst || id?.type !== 'Identifier' || id.typeAnnotation || id.name === undefined) {
    return undefined;
  }

  if (!isBlockArrow(arrow) || arrow.typeParameters) {
    return undefined;
  }

  const declaration = {
    arrow,
    name: id.name,
  };

  return declaration;
};

const skipped = (state: State, reason: string | undefined): boolean => {
  if (reason !== undefined) {
    state.skip(reason);
  }

  return reason !== undefined;
};

const declarationSkipReason = (state: State, node: AstNode, found: ArrowDeclaration): string | undefined => {
  if (!STATEMENT_PARENTS.has(node.parent?.type)) {
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

const arrowDeclarationCase = (
  skipReason: DeclarationStep<string | undefined>,
  rewrite: DeclarationStep<Candidate>,
): Build => {
  return (state) => {
    const declarations = nodesOf(state, 'VariableDeclaration');

    return pickFirst(declarations, (node) => {
      const found = arrowDeclarationOf(node);

      if (!found) {
        return undefined;
      }

      const reason = skipReason(state, node, found);

      if (skipped(state, reason)) {
        return undefined;
      }

      return rewrite(state, node, found);
    });
  };
};

export const functionDeclarationCase: Build = arrowDeclarationCase(
  declarationSkipReason,
  (state, node, found) => {
    const declaration = writeFunction(state, found.arrow, `function ${found.name}`);

    return replaced(state, node.range[0], node.range[1], declaration);
  },
);

export const functionExpressionCase: Build = arrowDeclarationCase(
  (state, _node, found) => {
    return arrowBodySkipReason(state, found.arrow, found.arrow.range[0]);
  },
  (state, _node, found) => {
    const expression = writeFunction(state, found.arrow, 'function ');

    return replaced(state, found.arrow.range[0], found.arrow.range[1], expression);
  },
);

const objectArrowProperty = (node: AstNode): BlockArrow | undefined => {
  const arrow = nodeOf(node.value);

  const isPlainProperty = node.kind === 'init' && node.method !== true && node.computed !== true;

  return isPlainProperty && isBlockArrow(arrow) && !arrow.typeParameters ? arrow : undefined;
};

// The key sits outside the function's range, so shorthand replaces the whole property.
export const propertyFunctionCase = (asMethod: boolean): Build => {
  return (state) => {
    const properties = nodesOf(state, 'Property');

    return pickFirst(properties, (node) => {
      const arrow = objectArrowProperty(node);

      if (!arrow || !node.key) {
        return undefined;
      }

      const reason = arrowBodySkipReason(state, arrow, node.range[0]);

      if (skipped(state, reason)) {
        return undefined;
      }

      if (asMethod) {
        const method = writeFunction(state, arrow, textOf(state, node.key));

        return replaced(state, node.range[0], node.range[1], method);
      }

      const expression = writeFunction(state, arrow, 'function ');

      return replaced(state, arrow.range[0], arrow.range[1], expression);
    });
  };
};

export const defaultExportFunctionCase: Build = (state) => {
  const defaultExports = nodesOf(state, 'ExportDefaultDeclaration');

  return pickFirst(defaultExports, (node) => {
    const arrow = node.declaration;

    if (!isBlockArrow(arrow)) {
      return undefined;
    }

    const reason = arrowBodySkipReason(state, arrow, arrow.range[0]);

    if (skipped(state, reason)) {
      return undefined;
    }

    const expression = writeFunction(state, arrow, 'function ');

    return replaced(state, arrow.range[0], arrow.range[1], expression);
  });
};

// Parenthesised so an object literal keeps its meaning.
export const expressionBodyCase: Build = (state) => {
  const arrows = nodesOf(state, 'ArrowFunctionExpression');

  return pickFirst(arrows, (node) => {
    const body = nodeOf(node.body);
    const statements = listOf(body?.body);
    const argument = statements[0]?.type === 'ReturnStatement' ? statements[0].argument : undefined;

    if (body?.type !== 'BlockStatement' || statements.length !== 1 || !argument) {
      return undefined;
    }

    const arrowText = textOf(state, node);

    if (ARROW_HAZARDS.test(arrowText)) {
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
    const expressionStatements = nodesOf(state, 'ExpressionStatement');

    return pickFirst(expressionStatements, (node) => {
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
  const awaits = nodesOf(state, 'AwaitExpression');

  return pickFirst(awaits, (node) => {
    const { argument } = node;

    if (!inFunction(node)) {
      state.skip('await at module top level, which the rule exempts under strict too');

      return undefined;
    }

    return argument && awaitGapIsClean(state, node, argument)
      ? replaced(state, argument.range[0], argument.range[1], `(${textOf(state, argument)}).then(() => {})`)
      : undefined;
  });
};

// Unpicking a real `try`/`catch` would mean choosing the handler's statements, so the edit goes this way only.
export const awaitedHandlerCase = (suffix: string): Build => {
  return (state) => {
    const awaits = nodesOf(state, 'AwaitExpression');

    return pickFirst(awaits, (node) => {
      const { argument } = node;

      return argument && awaitGapIsClean(state, node, argument)
        ? replaced(state, node.range[0], node.range[1], `await (${textOf(state, argument)})${suffix}`)
        : undefined;
    });
  };
};

export const asyncReturnHandlerCase: Build = (state) => {
  const returns = nodesOf(state, 'ReturnStatement');

  return pickFirst(returns, (node) => {
    const { argument } = node;

    if (!argument || inFunction(node)?.async !== true) {
      return undefined;
    }

    if (commentsIn(state, node.range[0], argument.range[0])) {
      state.skip('comment between `return` and its argument');

      return undefined;
    }

    return replaced(
      state,
      argument.range[0],
      argument.range[1],
      `(${textOf(state, argument)}).catch(${PROBE_HANDLER})`,
    );
  });
};

// Textual and over-skipping: a missed shadow, such as `const [monaco, setMonaco]`, reads as a rule defect.
const shadowsName = (state: State, node: AstNode, name: string): boolean => {
  const escaped = escapeName(name);
  const declares = new RegExp(String.raw`\b(?:const|let|var|function|class)\b[^;=]*\b${escaped}\b`);
  const named = new RegExp(String.raw`\b${escaped}\b`);

  for (let current: AstNode | undefined = node; current && current.type !== 'Program'; current = current.parent) {
    const currentText = textOf(state, current);

    if (declares.test(currentText) || (current.params ?? [])
      .some((param) => {
        const paramText = textOf(state, param);

        return named.test(paramText);
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

// Three depths: a rule that resolves names in the immediate scope only passes one.
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
  const { callee } = node;
  const isHookCall = callee?.type === 'Identifier' && callee.name !== undefined && hooks.includes(callee.name);

  // Of the nodes a call takes as an argument, only an array literal has `elements`.
  if (!isHookCall || !last?.elements) {
    return undefined;
  }

  const { elements } = last;
  const names = elements
    .flatMap((element) => {
      const elementNames = element?.type === 'Identifier' && element.name !== undefined ? [element.name] : [];

      return elementNames;
    });

  if (names.length !== elements.length) {
    return undefined;
  }

  const dependencies = {
    array: last,
    names,
  };

  return dependencies;
};

// Not reversed: a reversed array can land sorted by accident.
export const hookOrderCase = (hooks: string[], wanted: 'asc' | 'desc'): Build => {
  return (state) => {
    const calls = nodesOf(state, 'CallExpression');

    return pickFirst(calls, (node) => {
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

      const unsafe = unsafeToReflow(state, found.array.range[0], found.array.range[1]);

      return skipped(state, unsafe)
        ? undefined
        : replaced(state, found.array.range[0], found.array.range[1], `[${target.join(', ')}]`);
    });
  };
};

const propsPatternNames = (pattern: AstNode | undefined): string[] | undefined => {
  const properties = pattern?.type === 'ObjectPattern' ? listOf(pattern.properties) : [];
  const names = properties
    .flatMap((property) => {
      const value = nodeOf(property.value);

      const isShorthand = property.type === 'Property' && property.computed !== true && property.shorthand === true;
      const valueName = value?.type === 'Identifier' ? value.name : undefined;
      const propertyNames = isShorthand && valueName !== undefined ? [valueName] : [];

      return propertyNames;
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
      return parent.elements?.includes(node) === true;
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
      return parent.id === node || parent.params?.includes(node) === true;
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

const LABELLED = new Set([
  'LabeledStatement',
  'BreakStatement',
  'ContinueStatement',
]);

const isNonReference = (node: AstNode): boolean => {
  const { parent } = node;

  const isKey = parent?.key === node && KEYED.has(parent.type) && parent.computed !== true;
  const isProperty = parent?.property === node && parent.type === 'MemberExpression' && parent.computed !== true;
  const isLabel = parent?.label === node && LABELLED.has(parent.type);

  return isKey || isProperty || isLabel;
};

// The destructured names are the ground truth, so no scope analysis is needed.
const componentPropsRewrite = (state: State, fn: AstNode, names: string[]): Candidate | undefined => {
  const body = nodeOf(fn.body);
  const [firstParam] = listOf(fn.params);

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
    .filter((node): node is Named => {
      return node.name !== undefined && names.includes(node.name)
        && node.range[0] >= body.range[0] && node.range[1] <= body.range[1];
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
        const edit = {
          from: node.range[0] - base,
          to: node.range[1] - base,
          text: `${PROBE_PROPS}.${node.name}`,
        };

        return edit;
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
  const declarators = nodesOf(state, 'VariableDeclarator');

  return pickFirst(declarators, (node) => {
    const { id, init } = node;
    const names = init?.type === 'ArrowFunctionExpression' ? propsPatternNames(init.params?.[0]) : undefined;

    const isComponent = id?.type === 'Identifier' && id.name !== undefined && /^[A-Z]/.test(id.name);

    return isComponent && init && names ? componentPropsRewrite(state, init, names) : undefined;
  });
};

export const functionDeclarationComponentCase: Build = (state) => {
  const functionDeclarations = nodesOf(state, 'FunctionDeclaration');

  return pickFirst(functionDeclarations, (node) => {
    const names = propsPatternNames(node.params?.[0]);

    return /^[A-Z]/.test(node.id?.name ?? '') && names ? componentPropsRewrite(state, node, names) : undefined;
  });
};
