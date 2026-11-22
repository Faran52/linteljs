import ts from 'typescript';

import { FUNCTION_KINDS } from '../constants';

import { type Sources } from './bindingUtils';
import {
  copied,
  copyOf,
  type Edit,
  editOver,
  joined,
  patternOf,
  takenOut,
  type Written,
} from './editUtils';
import {
  isProvenPure,
  pathFault,
  type Proof,
} from './effectUtils';
import { type Follower } from './followUtils';
import { referencesTo, scopeOf } from './scopeUtils';
import {
  collect,
  indentOf,
  linesGone,
  ownsLines,
  referencesIn,
  type Span,
  spanOf,
} from './sourceUtils';
import {
  batched,
  type Candidate,
  type Step,
} from './stepUtils';

/**
 * Pruning drops a binding only when filling made it unread: something read it before filling and nothing reads its
 * name after. What dropping it would stop running must run nothing: a default or a value is pure on proof, and a
 * member a body pattern takes is proven a plain property.
 */

// A name a binding gives, what declares it, and the code its reads are counted in.
interface Bound {
  name: ts.Identifier;
  declaration: ts.Declaration;
  scope: ts.Node;
}

interface Pruning {
  follower: Follower;
  text: string;
  proof: () => Proof;
}

// A `const` or `let` statement pruning may take a declarator from: not exported, not declared, no `using`.
interface Held {
  statement: ts.VariableStatement;
  scope: ts.Node;
}

// A parameter written as an object pattern, the only kind pruning writes again.
interface Patterned {
  parameter: ts.ParameterDeclaration;
  pattern: ts.ObjectBindingPattern;
}

// A function written with parameters of its own: one without a body has no read of them, so nothing to prune.
const isFunction = (node: ts.Node): node is ts.FunctionLikeDeclaration => {
  return FUNCTION_KINDS.has(node.kind);
};

const patternedOf = (owner: ts.FunctionLikeDeclaration): Patterned[] => {
  return owner.parameters
    .flatMap((parameter) => {
      const { name } = parameter;
      const patterned: Patterned[] = ts.isObjectBindingPattern(name)
        ? [{
            parameter,
            pattern: name,
          }]
        : [];

      return patterned;
    });
};

// The code a statement's bindings are seen in: the block it stands in, or every clause of its `switch`.
const scopeOfStatement = (statement: ts.Statement): ts.Node => {
  const { parent } = statement;

  return ts.isCaseClause(parent) || ts.isDefaultClause(parent) ? parent.parent : parent;
};

const heldIn = (file: ts.SourceFile): Held[] => {
  return collect(file, ts.isVariableStatement)
    .filter((statement) => {
      const { flags } = statement.declarationList;
      const isPlain = (flags & ts.NodeFlags.BlockScoped) !== 0 && (flags & ts.NodeFlags.Using) === 0;
      const modifiers = ts.getModifiers(statement);

      return isPlain && modifiers === undefined;
    })
    .map((statement) => {
      const held: Held = {
        statement,
        scope: scopeOfStatement(statement),
      };

      return held;
    });
};

// Each name a binding gives, through nested patterns, by the node that declares it.
const boundIn = (name: ts.BindingName, declaration: ts.Declaration, scope: ts.Node): Bound[] => {
  if (ts.isIdentifier(name)) {
    const bound: Bound[] = [{
      name,
      declaration,
      scope,
    }];

    return bound;
  }

  const elements: readonly ts.ArrayBindingElement[] = name.elements;

  return elements
    .filter(ts.isBindingElement)
    .flatMap((element) => {
      return boundIn(element.name, element, scope);
    });
};

// Every name pruning may drop: inside parameter patterns, and of `const` and `let` declarations.
const everyBound = (file: ts.SourceFile): Bound[] => {
  const parameters = collect(file, isFunction)
    .flatMap((owner) => {
      return patternedOf(owner)
        .flatMap(({ parameter, pattern }) => {
          return boundIn(pattern, parameter, owner);
        });
    });
  const declared = heldIn(file)
    .flatMap(({ statement, scope }) => {
      return statement.declarationList.declarations
        .flatMap((declaration) => {
          return boundIn(declaration.name, declaration, scope);
        });
    });

  const bound = [...parameters, ...declared];

  return bound;
};

// Tracks each name something reads before filling, the only ones pruning may drop.
export const trackRead = (file: ts.SourceFile, checker: ts.TypeChecker, follower: Follower): void => {
  for (const {
    name,
    declaration,
    scope,
  } of everyBound(file)) {
    if (referencesTo(checker, declaration, scope).length > 0) {
      follower.track(name);
    }
  }
};

const isUnread = (pruning: Pruning, name: ts.Identifier, scope: ts.Node): boolean => {
  return pruning.follower.has(name) && referencesIn(scope, name.text).length === 0;
};

const isPureValue = (pruning: Pruning, value: ts.Expression | undefined): boolean => {
  if (value === undefined) {
    return true;
  }

  const proof = pruning.proof();

  return isProvenPure(proof, value);
};

// The member a pattern element takes, undefined for a key only the running code knows.
const keyOfElement = (element: ts.BindingElement): string | undefined => {
  const key = element.propertyName ?? element.name;
  const isNamed = ts.isIdentifier(key) || ts.isStringLiteral(key) || ts.isNumericLiteral(key);

  return isNamed ? key.text : undefined;
};

const isPlainPath = (pruning: Pruning, owner: ts.Expression, path: readonly string[]): boolean => {
  const proof = pruning.proof();

  return pathFault(proof, owner, path) === undefined;
};

// Dropping an element stops its read and its default; a rest beside it would take what it no longer does.
const isDroppable = (
  pruning: Pruning,
  pattern: ts.ObjectBindingPattern,
  element: ts.BindingElement,
  owner: ts.Expression | undefined,
  path: readonly string[],
): boolean => {
  const isRest = pattern.elements
    .some((each) => {
      return each.dotDotDotToken !== undefined;
    });
  const isPlainRead = owner === undefined || isPlainPath(pruning, owner, path);

  return !isRest && isPureValue(pruning, element.initializer) && isPlainRead;
};

// What a pattern keeps, each element as written or with its own pattern pruned; undefined when it drops nothing.
// `owner` is the value a body pattern reads, whose members must be proven plain to drop a read of them.
const keptIn = (
  pruning: Pruning,
  pattern: ts.ObjectBindingPattern,
  scope: ts.Node,
  owner: ts.Expression | undefined,
  path: readonly string[],
): Written[] | undefined => {
  const kept: Written[] = [];
  let isChanged = false;

  for (const element of pattern.elements) {
    const key = keyOfElement(element);
    const at = key === undefined ? undefined : [...path, key];
    const { name } = element;
    const isNested = ts.isObjectBindingPattern(name) && (owner === undefined || element.initializer === undefined);
    const inner = isNested && at !== undefined ? keptIn(pruning, name, scope, owner, at) : undefined;
    const isGone = ts.isIdentifier(name) ? isUnread(pruning, name, scope) : inner?.length === 0;
    const isDropped = isGone && at !== undefined && isDroppable(pruning, pattern, element, owner, at);

    isChanged ||= isDropped || inner !== undefined;

    if (isDropped) {
      continue;
    }

    if (inner === undefined) {
      kept.push(copyOf(element));
      continue;
    }

    const { text } = pruning;
    const before: Span = {
      start: element.getStart(),
      end: name.getStart(),
    };
    const after: Span = {
      start: name.getEnd(),
      end: element.getEnd(),
    };

    const indent = indentOf(text, name);
    const nested = patternOf(inner, indent);

    kept.push(joined([
      copied(text, before),
      nested,
      copied(text, after),
    ]));
  }

  return isChanged ? kept : undefined;
};

// A pattern written again with what it keeps.
const patternOver = (pruning: Pruning, pattern: ts.BindingPattern, kept: readonly Written[]): Edit => {
  const indent = indentOf(pruning.text, pattern);
  const printed = patternOf(kept, indent);

  return editOver(pattern, printed);
};

// A parameter keeps its place, so the function's arity holds: only names inside its pattern go, down to `{}`.
const parameterPruned = (
  pruning: Pruning,
  owner: ts.FunctionLikeDeclaration,
  pattern: ts.ObjectBindingPattern,
): Edit[] | undefined => {
  const kept = keptIn(pruning, pattern, owner, undefined, []);
  const edits = kept === undefined ? undefined : [patternOver(pruning, pattern, kept)];

  return edits;
};

// A declarator taken out of its list, or the lines of its statement when it is the only one, the statement owns its
// lines and no comment is above it.
const declaratorGone = (
  pruning: Pruning,
  statement: ts.VariableStatement,
  declaration: ts.VariableDeclaration,
): Edit[] | undefined => {
  const { declarations } = statement.declarationList;
  const index = declarations.indexOf(declaration);
  const previous = declarations[index - 1];
  const next = declarations[index + 1];

  if (previous !== undefined || next !== undefined) {
    const span: Span = {
      start: previous === undefined ? declaration.getStart() : previous.getEnd(),
      end: next === undefined ? declaration.getEnd() : next.getStart(),
    };
    const gone = [takenOut(span)];

    return gone;
  }

  const { text } = pruning;
  const comments = ts.getLeadingCommentRanges(text, statement.getFullStart());
  const span = spanOf(statement);
  const lines = linesGone(text, span);

  const gone = [takenOut(lines)];

  return comments === undefined && ownsLines(text, span) ? gone : undefined;
};

const declarationPruned = (pruning: Pruning, held: Held, declaration: ts.VariableDeclaration): Edit[] | undefined => {
  const { statement, scope } = held;
  const { name, initializer } = declaration;

  const isPureInitializer = (): boolean => {
    return initializer !== undefined && isPureValue(pruning, initializer);
  };

  if (ts.isIdentifier(name)) {
    const isGone = isUnread(pruning, name, scope) && isPureInitializer();

    return isGone ? declaratorGone(pruning, statement, declaration) : undefined;
  }

  const kept = ts.isObjectBindingPattern(name) && initializer !== undefined
    ? keptIn(pruning, name, scope, initializer, [])
    : undefined;

  if (kept === undefined) {
    return undefined;
  }

  if (kept.length > 0) {
    const pruned = [patternOver(pruning, name, kept)];

    return pruned;
  }

  return isPureInitializer() ? declaratorGone(pruning, statement, declaration) : undefined;
};

const candidateOf = (node: ts.Node, edits: () => readonly Edit[] | undefined): Candidate => {
  const candidate: Candidate = {
    node,
    isAlone: () => {
      return false;
    },
    edits,
  };

  return candidate;
};

// Drops what filling left unread: a destructured name or a `const` or `let` declarator.
export const prunedOnce = (follower: Follower, sources: Sources): Step => {
  return (text, file) => {
    let proven: Proof | undefined;
    const pruning: Pruning = {
      follower,
      text,
      proof: () => {
        proven ??= {
          checker: scopeOf(file, sources.modules, sources.held),
          sources,
          given: new Map(),
        };

        return proven;
      },
    };
    const parameters = collect(file, isFunction)
      .flatMap((owner) => {
        return patternedOf(owner)
          .map(({ parameter, pattern }) => {
            return candidateOf(parameter, () => {
              return parameterPruned(pruning, owner, pattern);
            });
          });
      });
    const declared = heldIn(file)
      .flatMap((held) => {
        return held.statement.declarationList.declarations
          .map((declaration) => {
            return candidateOf(declaration, () => {
              return declarationPruned(pruning, held, declaration);
            });
          });
      });
    const candidates = [...parameters, ...declared]
      .toSorted((left, right) => {
        return left.node.getStart() - right.node.getStart();
      });

    return batched(text, candidates);
  };
};
