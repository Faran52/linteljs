import ts from 'typescript';

import { resolved, type Sources } from './bindingUtils';
import {
  applied,
  type Edit,
  refusal,
} from './editUtils';
import { referencesTo, resolvedAt } from './scopeUtils';
import {
  collect,
  expressionOf,
  fitted,
  indentOf,
  isPure,
  isReference,
  isWithin,
  isWritten,
  reindent,
  spanOf,
  swapped,
  textOf,
  unparen,
  valueOf,
} from './sourceUtils';
import { landedCheck } from './stepUtils';

type ValueMember = ts.PropertyAssignment | ts.ShorthandPropertyAssignment;

// A value's text, and the indentation its first line was written at.
interface Inlined {
  value: string;
  from: string;
}

// The value an option exports under a binding, undefined for a type or a declaration with none.
export const exportedValue = (sources: Sources, local: string): ts.Expression | undefined => {
  const exported = resolved(sources, local);
  const initializer = ts.isVariableDeclaration(exported) ? exported.initializer : undefined;

  return initializer === undefined ? undefined : valueOf(initializer);
};

export const arrowOf = (sources: Sources, local: ts.Identifier): ts.ArrowFunction => {
  const value = exportedValue(sources, local.text);

  if (value === undefined || !ts.isArrowFunction(value)) {
    throw refusal(local, 'An option export called or rendered here must be an arrow function');
  }

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

const LOGICAL = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
]);

// Whether the option's code may run a read later, more than once or not at all.
const isDeferred = (read: ts.Node, inner: ts.Node): boolean => {
  const { parent } = read;
  const isBranch = ts.isConditionalExpression(parent) && parent.condition !== read;
  const isRight = ts.isBinaryExpression(parent) && parent.right === read && LOGICAL.has(parent.operatorToken.kind);

  if (ts.isFunctionLike(parent) || isBranch || isRight) {
    return true;
  }

  return parent !== inner && isDeferred(parent, inner);
};

// Arguments with an effect run in the order they were written, so their reads must come in that order too.
export const orderCheck = (
  checker: ts.TypeChecker,
  inner: ts.Node,
  given: ReadonlyMap<ts.Declaration, ts.Expression>,
): void => {
  const positions = [...given.entries()]
    .filter(([, argument]) => {
      return !isPure(argument);
    })
    .flatMap(([declaration]) => {
      return referencesTo(checker, declaration, inner);
    })
    .map((read) => {
      return read.getStart();
    });
  const ordered = positions
    .toSorted((left, right) => {
      return left - right;
    });

  if (positions.join(',') !== ordered.join(',')) {
    throw refusal(inner, 'Arguments with an effect are read in another order than they are passed');
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
  const count = String(reads.length);
  const name = textOf(declaration.name);

  if (!isPure(argument) && reads.length !== 1) {
    throw refusal(argument, `An argument with an effect must be read once, and "${name}" is read ${count} times`);
  }

  const [only] = reads;

  if (!isPure(argument) && only !== undefined && only !== inner && isDeferred(only, inner)) {
    throw refusal(argument, `An argument with an effect must run where the call did, and "${name}" is read later`);
  }

  if (ts.isIdentifier(argument) && argument.text === name) {
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

  const dropped = call.arguments
    .slice(arrow.parameters.length)
    .find((argument) => {
      return !isPure(argument);
    });

  if (dropped !== undefined || call.arguments.some(ts.isSpreadElement)) {
    throw refusal(call, 'An argument the option takes no parameter for must have no effect, and none may be spread');
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

  captureCheck(checker, returned, given);
  orderCheck(checker, returned, given);

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

const isValueMember = (property: ts.ObjectLiteralElementLike): property is ValueMember => {
  return ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property);
};

const memberOf = (sources: Sources, owner: ts.Identifier, access: ts.PropertyAccessExpression): ts.Expression => {
  const table = exportedValue(sources, owner.text);

  if (table === undefined || !ts.isObjectLiteralExpression(table)) {
    throw refusal(access, 'An option export read by member must be an object literal');
  }

  // The last of two members with one name is the one an object keeps.
  const member = table.properties
    .filter(isValueMember)
    .findLast((property) => {
      return ts.isIdentifier(property.name) && property.name.text === access.name.text;
    });

  if (member === undefined) {
    throw refusal(access, `The option's "${owner.text}" has no member "${access.name.text}"`);
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

    const answer = calledWith(checker, sources, value, call);

    return landed(text, call, answer);
  }

  if (!isPure(value)) {
    throw refusal(access, 'A member read as a value must have no effect');
  }

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

  if (value === undefined || !isPure(value) || isWritten(local)) {
    throw refusal(local.parent, 'An option export read as a value must be a constant with no effect, never written');
  }

  landedCheck(checker, sources, value, value, local);

  const read = written(local, value);

  return landed(text, local, read);
};
