import ts from 'typescript';

import { EFFECT_KINDS, LOGICAL } from '../constants';

import { resolved, type Sources } from './bindingUtils';
import {
  applied,
  type Edit,
  refusal,
} from './editUtils';
import {
  actsIn,
  type Proof,
  pureCheck,
} from './effectUtils';
import {
  declarationOf,
  referencesTo,
  resolvedAt,
} from './scopeUtils';
import {
  collect,
  expressionOf,
  fitted,
  indentOf,
  isReference,
  isValueMember,
  isWithin,
  isWritten,
  keyOf,
  memberIn,
  reindent,
  spanOf,
  swapped,
  textOf,
  unparen,
  valueOf,
} from './sourceUtils';
import { landedCheck } from './stepUtils';

// A value's text, and the indentation its first line was written at.
interface Inlined {
  value: string;
  from: string;
}

type ArgumentKind = 'effect' | 'stable' | 'mutable';

// What the option's code receives in place of a parameter, in the order the base passes it.
export interface Passed {
  declaration: ts.ParameterDeclaration | ts.BindingElement;
  kind: ArgumentKind;
  shown: ts.Node;
}

interface EffectRead {
  index: number;
  read: ts.Identifier;
}

// The value an option exports under a binding, undefined for a type or a declaration with none.
export const exportedValue = (sources: Sources, local: string): ts.Expression | undefined => {
  const exported = resolved(sources, local);
  const initializer = ts.isVariableDeclaration(exported) ? exported.initializer : undefined;

  return initializer === undefined ? undefined : valueOf(initializer);
};

// An async function answers a promise of what it returns, so what it returns cannot stand in for the call.
const syncCheck = (arrow: ts.ArrowFunction): void => {
  const isAsync = arrow.modifiers
    ?.some((modifier) => {
      return modifier.kind === ts.SyntaxKind.AsyncKeyword;
    });

  if (isAsync === true) {
    throw refusal(arrow, 'An async option function answers a promise, so it is never inlined as what it returns');
  }
};

export const arrowOf = (sources: Sources, local: ts.Identifier): ts.ArrowFunction => {
  const value = exportedValue(sources, local.text);

  if (value === undefined || !ts.isArrowFunction(value)) {
    throw refusal(local, 'An option export called or rendered here must be an arrow function');
  }

  syncCheck(value);

  return value;
};

// What a function answers: its expression body, or the one expression its block returns.
export const returnedOf = (arrow: ts.ArrowFunction): ts.Expression => {
  if (!ts.isBlock(arrow.body)) {
    return arrow.body;
  }

  const [only, ...more] = arrow.body.statements;
  const answer = only !== undefined && ts.isReturnStatement(only) ? only.expression : undefined;

  if (answer === undefined || more.length > 0) {
    throw refusal(arrow, 'A function inlined as an expression must only return one');
  }

  return answer;
};

// An argument must not read a name the option's own code binds around a read of its parameter: it would read that.
export const captureCheck = (
  checker: ts.TypeChecker,
  inner: ts.Node,
  given: ReadonlyMap<ts.Declaration, ts.Expression>,
): void => {
  const captured = [...given.entries()]
    .flatMap(([declaration, argument]) => {
      const sites = referencesTo(checker, declaration, inner);
      const reads = collect(argument, ts.isIdentifier).filter(isReference);

      return reads
        .filter((read) => {
          return sites
            .some((site) => {
              const found = resolvedAt(checker, read, site);

              return found !== undefined && isWithin(found, inner);
            });
        });
    })
    .at(0);

  if (captured !== undefined) {
    throw refusal(captured, `"${captured.text}" is also bound inside the option's code, which would capture it`);
  }
};

// Of code proven to act on nothing, a call, read or spread still reads what other code may write.
const isRead = (node: ts.Node): boolean => {
  return EFFECT_KINDS.has(node.kind);
};

// The nodes under a node that pass a test, without looking into a function, which runs only when called.
const heldIn = (node: ts.Node, test: (node: ts.Node) => boolean): ts.Node[] => {
  const held = test(node) ? [node] : [];

  if (!ts.isFunctionLike(node)) {
    node
      .forEachChild((child) => {
        held.push(...heldIn(child, test));
      });
  }

  return held;
};

// A `let` or `var`, or a parameter something assigns to.
const isWritable = (checker: ts.TypeChecker, read: ts.Node): boolean => {
  const declaration = ts.isIdentifier(read) && isReference(read) ? declarationOf(checker, read) : undefined;
  const holder = declaration !== undefined && ts.isBindingElement(declaration)
    ? ts.walkUpBindingElementsAndPatterns(declaration)
    : declaration;

  if (holder !== undefined && ts.isVariableDeclaration(holder)) {
    return (ts.getCombinedNodeFlags(holder) & ts.NodeFlags.Const) === 0;
  }

  if (declaration === undefined || holder === undefined || !ts.isParameter(holder)) {
    return false;
  }

  const reads = referencesTo(checker, declaration, declaration.getSourceFile());

  return reads.some(isWritten);
};

// How an argument can change by moving: by running its effect, or by reading what other code may write.
export const kindOf = (proof: Proof, argument: ts.Expression): ArgumentKind => {
  const { checker } = proof;
  const acting = actsIn(proof, argument);

  if (acting.length > 0) {
    return 'effect';
  }

  const isMutable = heldIn(argument, isRead).length > 0 || heldIn(argument, (node) => {
    return isWritable(checker, node);
  }).length > 0;

  return isMutable ? 'mutable' : 'stable';
};

// Whether the option's code may run a read later, or more than once; with `isSkippable`, or not at all.
const isDeferred = (node: ts.Node, inner: ts.Node, isSkippable: boolean): boolean => {
  if (node === inner) {
    return false;
  }

  const { parent } = node;
  const isBranch = ts.isConditionalExpression(parent) && parent.condition !== node;
  const isRight = ts.isBinaryExpression(parent) && parent.right === node && LOGICAL.has(parent.operatorToken.kind);
  const isTail = ts.isOptionalChain(parent) && parent.expression !== node;

  const isEnclosed = ts.isFunctionLike(parent) || ts.isClassLike(parent);
  const isSkipped = isBranch || isRight || isTail;

  if (isEnclosed || (isSkippable && isSkipped)) {
    return true;
  }

  return isDeferred(parent, inner, isSkippable);
};

// The first thing of the option's code not proven to act on nothing that runs before a read, as code runs left to
// right.
const effectBefore = (proof: Proof, read: ts.Node, inner: ts.Node): ts.Node | undefined => {
  const start = read.getStart();

  return actsIn(proof, inner)
    .find((effect) => {
      return effect.getEnd() <= start;
    });
};

// An argument with an effect runs where the call did only when it is read once, then, after nothing that may act.
const effectRead = (proof: Proof, inner: ts.Node, passed: Passed): ts.Identifier => {
  const reads = referencesTo(proof.checker, passed.declaration, inner);
  const name = textOf(passed.declaration.name);
  const [only] = reads;

  if (only === undefined || reads.length > 1) {
    const count = String(reads.length);

    throw refusal(passed.shown, `An argument with an effect must be read once, and "${name}" is read ${count} times`);
  }

  if (isDeferred(only, inner, true)) {
    throw refusal(passed.shown, `An argument with an effect must run where the call did, and "${name}" is read later`);
  }

  const before = effectBefore(proof, only, inner);

  if (before !== undefined) {
    throw refusal(before, `An argument with an effect must run first, and "${name}" is read after this, which may act`);
  }

  return only;
};

/**
 * Arguments run before the option's code, in the order passed. One with an effect is inlined only where it is read
 * once, not deferred, after code proven to act on nothing; one that reads what may be written, only where nothing
 * could have written it yet.
 */
export const effectCheck = (proof: Proof, inner: ts.Node, passed: readonly Passed[]): void => {
  const { checker } = proof;
  const effects = passed
    .flatMap((each, index): EffectRead[] => {
      if (each.kind !== 'effect') {
        return [];
      }

      const found: EffectRead[] = [
        {
          index,
          read: effectRead(proof, inner, each),
        },
      ];

      return found;
    });
  const isOrdered = effects
    .every((effect, at) => {
      const previous = effects[at - 1];

      return previous === undefined || previous.read.getStart() < effect.read.getStart();
    });

  if (!isOrdered) {
    throw refusal(inner, 'Arguments with an effect are read in another order than they are passed');
  }

  for (const [index, each] of passed.entries()) {
    const reads = each.kind === 'mutable' ? referencesTo(checker, each.declaration, inner) : [];
    const isMoved = reads
      .some((read) => {
        const isPast = effects
          .some((effect) => {
            return (effect.index < index) !== (effect.read.getStart() < read.getStart());
          });

        return isPast || isDeferred(read, inner, false) || effectBefore(proof, read, inner) !== undefined;
      });

    if (isMoved) {
      const name = textOf(each.declaration.name);
      const reason = `An argument that may be written must be read before anything can write it, and "${name}" is not`;

      throw refusal(each.shown, reason);
    }
  }
};

// One edit per read of a parameter, each taking the argument's text.
export const substitutions = (
  checker: ts.TypeChecker,
  inner: ts.Node,
  declaration: ts.ParameterDeclaration | ts.BindingElement,
  argument: ts.Expression,
): Edit[] => {
  const reads = referencesTo(checker, declaration, inner);

  if (ts.isIdentifier(argument) && argument.text === textOf(declaration.name)) {
    return [];
  }

  return reads
    .map((read) => {
      const edit: Edit = {
        ...spanOf(read),
        insert: fitted(read, argument),
      };

      return edit;
    });
};

// A call's value: the function's returned expression with each parameter replaced by its argument.
const calledWith = (
  checker: ts.TypeChecker,
  sources: Sources,
  arrow: ts.ArrowFunction,
  call: ts.CallExpression,
): Inlined => {
  const returned = returnedOf(arrow);
  const offset = returned.getStart();

  landedCheck(checker, sources, arrow, returned, call);

  const reason = 'An argument the option takes no parameter for must have no effect, and none may be spread';
  const extra = refusal(call, reason);

  if (call.arguments.some(ts.isSpreadElement)) {
    throw extra;
  }

  const pairs = arrow.parameters
    .map((parameter, index) => {
      const argument = call.arguments[index];
      const isPlain = parameter.initializer === undefined && parameter.dotDotDotToken === undefined;

      if (!ts.isIdentifier(parameter.name) || !isPlain || argument === undefined) {
        throw refusal(call, 'Every parameter must be a plain name with an argument');
      }

      const pair: [ts.ParameterDeclaration, ts.Expression] = [parameter, argument];

      return pair;
    });
  const given = new Map<ts.Declaration, ts.Expression>(pairs);
  const proof: Proof = {
    checker,
    sources,
    given,
  };

  for (const argument of call.arguments.slice(arrow.parameters.length)) {
    pureCheck(proof, argument, extra);
  }

  const passed = pairs
    .map(([parameter, argument]) => {
      const each: Passed = {
        declaration: parameter,
        kind: kindOf(proof, argument),
        shown: argument,
      };

      return each;
    });

  captureCheck(checker, returned, given);
  effectCheck(proof, returned, passed);

  const edits = pairs
    .flatMap(([parameter, argument]) => {
      return substitutions(checker, returned, parameter, argument);
    })
    .map((edit) => {
      const moved: Edit = {
        start: edit.start - offset,
        end: edit.end - offset,
        insert: edit.insert,
      };

      return moved;
    });
  const filled = applied(textOf(returned), edits);
  const expression = unparen(expressionOf(filled));
  const origin = unparen(returned);

  const inlined: Inlined = {
    value: fitted(call, expression),
    from: indentOf(origin.getSourceFile().text, origin),
  };

  return inlined;
};

// A value's text in place of a node, its later lines moved to the indentation of the line it lands on.
const landed = (text: string, replaced: ts.Node, { value, from }: Inlined): string => {
  const to = indentOf(text, replaced);
  const moved = reindent(value, from, to);

  return swapped(text, replaced, moved);
};

// An option's own value as it is written, ready to land where it is read.
const written = (replaced: ts.Node, value: ts.Expression): Inlined => {
  const inlined: Inlined = {
    value: fitted(replaced, value),
    from: indentOf(value.getSourceFile().text, value),
  };

  return inlined;
};

export const inlineCall = (
  text: string,
  sources: Sources,
  local: ts.Identifier,
  call: ts.CallExpression,
  checker: ts.TypeChecker,
): string => {
  const arrow = arrowOf(sources, local);
  const value = calledWith(checker, sources, arrow, call);

  return landed(text, call, value);
};

const memberOf = (sources: Sources, owner: ts.Identifier, access: ts.PropertyAccessExpression): ts.Expression => {
  const table = exportedValue(sources, owner.text);

  if (table === undefined || !ts.isObjectLiteralExpression(table)) {
    throw refusal(access, 'An option export read by member must be an object literal');
  }

  const name = access.name.text;
  const member = memberIn(table, name);

  if (member === undefined) {
    throw refusal(access, `The option's "${owner.text}" has no member "${name}"`);
  }

  if (!isValueMember(member) || keyOf(member) !== name) {
    const through = 'a spread, a computed key, a method or an accessor';

    throw refusal(access, `The option's "${owner.text}" may give "${name}" through ${through}`);
  }

  return ts.isPropertyAssignment(member) ? valueOf(member.initializer) : member.name;
};

export const inlineMember = (
  text: string,
  sources: Sources,
  local: ts.Identifier,
  access: ts.PropertyAccessExpression,
  checker: ts.TypeChecker,
): string => {
  const value = memberOf(sources, local, access);
  const call = access.parent;

  if (isWritten(access)) {
    throw refusal(access.parent, 'An option member can be read, never written');
  }

  if (ts.isCallExpression(call) && call.expression === access) {
    if (!ts.isArrowFunction(value)) {
      throw refusal(access, 'A member called here must be an arrow function');
    }

    syncCheck(value);

    const answer = calledWith(checker, sources, value, call);

    return landed(text, call, answer);
  }

  const proof: Proof = {
    checker,
    sources,
    given: new Map(),
  };

  pureCheck(proof, value, refusal(access, 'A member read as a value must have no effect'));

  landedCheck(checker, sources, value, value, access);

  const read = written(access, value);

  return landed(text, access, read);
};

export const inlineValue = (
  text: string,
  sources: Sources,
  local: ts.Identifier,
  checker: ts.TypeChecker,
): string => {
  const value = exportedValue(sources, local.text);
  const proof: Proof = {
    checker,
    sources,
    given: new Map(),
  };

  const reason = 'An option export read as a value must be a constant with no effect, never written';
  const refused = refusal(local.parent, reason);

  if (value === undefined || isWritten(local)) {
    throw refused;
  }

  pureCheck(proof, value, refused);

  landedCheck(checker, sources, value, value, local);

  const read = written(local, value);

  return landed(text, local, read);
};
