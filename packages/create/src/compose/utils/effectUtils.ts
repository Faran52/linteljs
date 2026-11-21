import ts from 'typescript';

import {
  BINARY_LEVELS,
  EFFECT_KINDS,
  UPDATES,
} from '../constants';

import {
  exportOf,
  localsOf,
  resolved,
  type Sources,
} from './bindingUtils';
import { refusal } from './editUtils';
import { aliasedOf, declarationOf } from './scopeUtils';
import {
  collect,
  isPrototype,
  isPure,
  isValueMember,
  isWritten,
  keyOf,
  memberIn,
  type MemberRead,
  textOf,
  unwrapped,
} from './sourceUtils';

/**
 * Code is taken to run nothing the author wrote only on proof. A member read is proven when the member is a plain
 * property of an object literal the engine sees, reached through `const`s, option calls and the arguments the site
 * passes, or when it goes through an import of a module declared plain data. A call is proven when it calls an
 * option arrow whose one answer is proven, or goes through an import of a module declared pure calls; its arguments
 * are proven on their own either way. Anything else may act.
 */

export interface Proof {
  checker: ts.TypeChecker;
  sources: Sources;
  // What each parameter of the code being inlined takes where it is inlined.
  given: ReadonlyMap<ts.Declaration, ts.Expression>;
}

// A member a read takes, by name; no name when only the running code knows it.
interface Key {
  name: string | undefined;
  shown: string;
}

// Where a value comes from: a module, or a name or code the engine cannot see through.
interface Origin {
  shown: string;
  isModule: boolean;
}

// The first member no proof covers, and where the value it is read from comes from.
export interface Fault {
  member: string;
  origin: Origin;
}

interface Context {
  proof: Proof;
  // The arguments of the site and of every option call being followed, by the parameter each fills.
  given: Map<ts.Declaration, ts.Expression>;
  // The option functions being followed, so one reached again from its own body is not followed.
  calling: Set<ts.Node>;
}

interface Walk {
  context: Context;
  // Whether an import of a specifier vouches for the rest of the path.
  isTrusted: (specifier: string) => boolean;
  // The nodes on the way to the current one, so a cycle is a fault.
  seen: Set<ts.Node>;
}

// Where a walk lands: the first step no proof covers, else every expression it can end at, none for a declared module.
interface Reached {
  fault: Fault | undefined;
  values: ts.Expression[];
}

// An option arrow a call enters, and the parameters its arguments fill.
interface Entered {
  arrow: ts.ArrowFunction;
  pairs: [ts.Declaration, ts.Expression][];
}

// A pattern matches a whole specifier, each `*` in it standing for any run of characters but `/`.
const isDeclared = (patterns: readonly string[], specifier: string): boolean => {
  return patterns
    .some((pattern) => {
      const parts = pattern
        .split('*')
        .map((part) => {
          return RegExp.escape(part);
        });
      const matcher = new RegExp(`^${parts.join('[^/]*')}$`, 'u');

      return matcher.test(specifier);
    });
};

const namedKey = (name: string): Key => {
  const key: Key = {
    name,
    shown: `"${name}"`,
  };

  return key;
};

const keyOfRead = (read: MemberRead): Key => {
  if (ts.isPropertyAccessExpression(read)) {
    return namedKey(read.name.text);
  }

  const argument = unwrapped(read.argumentExpression);

  if (ts.isStringLiteralLike(argument) || ts.isNumericLiteral(argument)) {
    return namedKey(argument.text);
  }

  const unknown: Key = {
    name: undefined,
    shown: `[${textOf(argument)}]`,
  };

  return unknown;
};

const faultOn = (path: readonly Key[], origin: Origin): Fault => {
  const [key] = path;
  const fault: Fault = {
    member: key === undefined ? 'every member' : key.shown,
    origin,
  };

  return fault;
};

const faultAt = (path: readonly Key[], origin: Origin): Reached => {
  const reached: Reached = {
    fault: faultOn(path, origin),
    values: [],
  };

  return reached;
};

const reachedAt = (values: ts.Expression[]): Reached => {
  const reached: Reached = {
    fault: undefined,
    values,
  };

  return reached;
};

const nameOrigin = (text: string): Origin => {
  const origin: Origin = {
    shown: `"${text}"`,
    isModule: false,
  };

  return origin;
};

const moduleOrigin = (specifier: string): Origin => {
  const origin: Origin = {
    shown: specifier,
    isModule: true,
  };

  return origin;
};

const walkOf = (context: Context, isTrusted: (specifier: string) => boolean): Walk => {
  const walk: Walk = {
    context,
    isTrusted,
    seen: new Set(),
  };

  return walk;
};

const readWalkOf = (context: Context): Walk => {
  const { plainData } = context.proof.sources;

  return walkOf(context, (specifier) => {
    return isDeclared(plainData, specifier);
  });
};

const callWalkOf = (context: Context): Walk => {
  const { pureCalls } = context.proof.sources;

  return walkOf(context, (specifier) => {
    return isDeclared(pureCalls, specifier);
  });
};

// A call into a module declared both pure calls and plain data answers plain data.
const answerWalkOf = (context: Context): Walk => {
  const { plainData, pureCalls } = context.proof.sources;

  return walkOf(context, (specifier) => {
    return isDeclared(pureCalls, specifier) && isDeclared(plainData, specifier);
  });
};

// Reading a path from an object literal: each step a plain property of it.
const literalStep = (walk: Walk, table: ts.ObjectLiteralExpression, path: readonly Key[], origin: Origin): Reached => {
  const [key, ...rest] = path;

  if (key === undefined) {
    return reachedAt([table]);
  }

  const member = key.name === undefined ? undefined : memberIn(table, key.name);

  if (member === undefined || !isValueMember(member) || keyOf(member) !== key.name || isPrototype(member)) {
    return faultAt(path, origin);
  }

  const value = ts.isPropertyAssignment(member) ? member.initializer : member.name;

  return rest.length === 0 ? reachedAt([value]) : reach(walk, value, rest, origin);
};

// A `const` whose value a proof can follow; any other declaration may hold anything.
const declaredStep = (
  walk: Walk,
  declaration: ts.Declaration | undefined,
  path: readonly Key[],
  origin: Origin,
): Reached => {
  const isVariable = declaration !== undefined && ts.isVariableDeclaration(declaration);
  const flags = isVariable ? ts.getCombinedNodeFlags(declaration) : 0;
  const isConstant = (flags & ts.NodeFlags.Const) !== 0 && (flags & ts.NodeFlags.Using) === 0;
  const initializer = isVariable && isConstant ? declaration.initializer : undefined;

  return initializer === undefined ? faultAt(path, origin) : reach(walk, initializer, path, origin);
};

// A name that resolves to nothing in the body: a parameter binding, an import of the base, or a global.
const outsideStep = (walk: Walk, name: ts.Identifier, path: readonly Key[]): Reached => {
  const { sources } = walk.context.proof;
  const binding = sources.bindings.get(name.text);

  if (binding !== undefined) {
    const exported = resolved(sources, name.text);
    const origin = moduleOrigin(binding.specifier);

    return declaredStep(walk, exported, path, origin);
  }

  const entry = sources.imports
    .find((each) => {
      return localsOf(each).includes(name.text);
    });
  const origin = entry === undefined ? nameOrigin(name.text) : moduleOrigin(entry.specifier);

  if (entry === undefined) {
    return faultAt(path, origin);
  }

  if (walk.isTrusted(entry.specifier)) {
    return reachedAt([]);
  }

  const module = sources.held.get(entry.specifier);
  const exported = entry.names.get(name.text);
  const found = module === undefined || exported === undefined ? undefined : exportOf(module, exported);

  return declaredStep(walk, found, path, origin);
};

const nameStep = (walk: Walk, name: ts.Identifier, path: readonly Key[], origin: Origin): Reached => {
  const { context } = walk;
  const declaration = declarationOf(context.proof.checker, name);

  if (declaration === undefined) {
    return outsideStep(walk, name, path);
  }

  const argument = context.given.get(declaration);

  if (argument !== undefined) {
    return reach(walk, argument, path, origin);
  }

  const statement = ts.findAncestor(declaration, ts.isImportDeclaration);

  if (statement === undefined) {
    const named = nameOrigin(name.text);

    return declaredStep(walk, declaration, path, named);
  }

  const specifier = textOf(statement.moduleSpecifier).slice(1, -1);

  if (walk.isTrusted(specifier)) {
    return reachedAt([]);
  }

  const target = aliasedOf(context.proof.checker, name);
  const imported = moduleOrigin(specifier);

  return declaredStep(walk, target, path, imported);
};

// Whether a walk ends at a trusted import for the callee of a call, every step on the way visible.
const isVouched = (walk: Walk, call: ts.CallExpression): boolean => {
  const origin = nameOrigin(textOf(call.expression));
  const { fault, values } = reach(walk, call.expression, [], origin);

  return fault === undefined && values.length === 0;
};

// The option arrow a call runs, synchronous, each parameter a plain name with an argument; undefined for any other.
const enteredOf = (context: Context, call: ts.CallExpression): Entered | undefined => {
  const walk = readWalkOf(context);
  const origin = nameOrigin(textOf(call.expression));
  const { fault, values } = reach(walk, call.expression, [], origin);
  const [value, ...more] = values.map(unwrapped);
  const isOne = fault === undefined && more.length === 0;
  const arrow = isOne && value !== undefined && ts.isArrowFunction(value) ? value : undefined;
  const options = [...context.proof.sources.modules.values()];
  const file = arrow?.getSourceFile();

  if (arrow === undefined || file === undefined || context.calling.has(arrow) || !options.includes(file)) {
    return undefined;
  }

  const isAsync = arrow.modifiers
    ?.some((modifier) => {
      return modifier.kind === ts.SyntaxKind.AsyncKeyword;
    });
  const pairs = arrow.parameters
    .flatMap((parameter, index): [ts.Declaration, ts.Expression][] => {
      const argument = call.arguments[index];
      const isBare = parameter.initializer === undefined && parameter.dotDotDotToken === undefined;
      const isFilled = isBare && ts.isIdentifier(parameter.name) && argument !== undefined;
      const pair: [ts.Declaration, ts.Expression][] = isFilled ? [[parameter, argument]] : [];

      return pair;
    });
  const isSpread = call.arguments.some(ts.isSpreadElement);

  if (isAsync === true || isSpread || pairs.length < arrow.parameters.length) {
    return undefined;
  }

  const entered: Entered = {
    arrow,
    pairs,
  };

  return entered;
};

// Runs a step inside an option arrow, its parameters taking the call's arguments.
const within = <T>(context: Context, { arrow, pairs }: Entered, step: () => T): T => {
  context.calling.add(arrow);

  for (const [parameter, argument] of pairs) {
    context.given.set(parameter, argument);
  }

  const result = step();

  for (const [parameter] of pairs) {
    context.given.delete(parameter);
  }

  context.calling.delete(arrow);

  return result;
};

// Every expression an arrow can answer; undefined when one of its returns answers nothing.
const answersOf = (arrow: ts.ArrowFunction): ts.Expression[] | undefined => {
  if (!ts.isBlock(arrow.body)) {
    const answers = [arrow.body];

    return answers;
  }

  const returns = collect(arrow.body, ts.isReturnStatement)
    .filter((statement) => {
      return ts.findAncestor(statement.parent, ts.isFunctionLike) === arrow;
    });
  const answers = returns
    .flatMap((statement) => {
      const answer = statement.expression === undefined ? [] : [statement.expression];

      return answer;
    });

  return answers.length === returns.length && answers.length > 0 ? answers : undefined;
};

// Reading a path from what a call answers: from what every return of the option arrow it runs answers.
const callStep = (walk: Walk, call: ts.CallExpression, path: readonly Key[], origin: Origin): Reached => {
  const answerWalk = answerWalkOf(walk.context);

  if (isVouched(answerWalk, call)) {
    return reachedAt([]);
  }

  const entered = enteredOf(walk.context, call);
  const answers = entered === undefined ? undefined : answersOf(entered.arrow);

  if (entered === undefined || answers === undefined) {
    return path.length === 0 ? reachedAt([call]) : faultAt(path, origin);
  }

  return within(walk.context, entered, () => {
    const each = answers
      .map((answer) => {
        return reach(walk, answer, path, origin);
      });
    const failed = each
      .find((reached) => {
        return reached.fault !== undefined;
      });
    const values = each
      .flatMap((reached) => {
        return reached.values;
      });

    return failed ?? reachedAt(values);
  });
};

const stepOf = (walk: Walk, value: ts.Expression, path: readonly Key[], origin: Origin): Reached => {
  if (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) {
    const key = keyOfRead(value);

    return reach(walk, value.expression, [key, ...path], origin);
  }

  if (ts.isIdentifier(value)) {
    return nameStep(walk, value, path, origin);
  }

  if (ts.isObjectLiteralExpression(value)) {
    return literalStep(walk, value, path, origin);
  }

  if (ts.isCallExpression(value)) {
    return callStep(walk, value, path, origin);
  }

  return path.length === 0 ? reachedAt([value]) : faultAt(path, origin);
};

// Where reading a path from what a node evaluates to lands; with no path, the values the node can hold.
const reach = (walk: Walk, node: ts.Expression, path: readonly Key[], origin: Origin): Reached => {
  const value = unwrapped(node);

  if (walk.seen.has(value)) {
    return faultAt(path, origin);
  }

  walk.seen.add(value);

  const reached = stepOf(walk, value, path, origin);

  walk.seen.delete(value);

  return reached;
};

const readFaultIn = (context: Context, read: MemberRead): Fault | undefined => {
  const origin = nameOrigin(textOf(read.expression));
  const walk = readWalkOf(context);
  const key = keyOfRead(read);

  return reach(walk, read.expression, [key], origin).fault;
};

const isPlainTable = (value: ts.Expression): boolean => {
  return ts.isObjectLiteralExpression(value) && value.properties
    .every((property) => {
      return isValueMember(property) && keyOf(property) !== undefined && !isPrototype(property);
    });
};

// A spread reads every own member: of each literal it can hold, each must be a plain value with a known key.
const spreadFaultIn = (context: Context, spread: ts.Expression): Fault | undefined => {
  const origin = nameOrigin(textOf(spread));
  const walk = readWalkOf(context);
  const { fault, values } = reach(walk, spread, [], origin);
  const isPlain = values.every(isPlainTable);

  return fault ?? (isPlain ? undefined : faultOn([], origin));
};

// A call whose callee reaches an import of a module declared pure calls, through visible steps.
const isPureCall = (context: Context, call: ts.CallExpression): boolean => {
  const walk = callWalkOf(context);

  return isVouched(walk, call);
};

// The one expression an arrow answers; undefined for a block that does more than return it.
const answerOf = (arrow: ts.ArrowFunction): ts.Expression | undefined => {
  const isSole = !ts.isBlock(arrow.body) || arrow.body.statements.length === 1;
  const answers = isSole ? answersOf(arrow) : undefined;

  return answers?.at(0);
};

// A call of an option arrow that answers one expression and runs nothing unproven; its arguments are the caller's.
const isProvenCall = (context: Context, call: ts.CallExpression): boolean => {
  const entered = enteredOf(context, call);
  const answer = entered === undefined ? undefined : answerOf(entered.arrow);

  if (entered === undefined || answer === undefined) {
    return false;
  }

  return within(context, entered, () => {
    return actingIn(context, answer).length === 0;
  });
};

// Whether evaluating a node may run code the author wrote or write a binding, its parts aside.
const isActing = (context: Context, node: ts.Node): boolean => {
  if (ts.isCallExpression(node)) {
    return !isProvenCall(context, node);
  }

  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    return readFaultIn(context, node) !== undefined;
  }

  if (ts.isJsxSpreadAttribute(node) || ts.isSpreadAssignment(node)) {
    return spreadFaultIn(context, node.expression) !== undefined;
  }

  if (ts.isBinaryExpression(node)) {
    return !BINARY_LEVELS.has(node.operatorToken.kind);
  }

  const isUpdate = ts.isPrefixUnaryExpression(node) && UPDATES.has(node.operator);

  return isUpdate || EFFECT_KINDS.has(node.kind);
};

// The callee of a pure call is trusted as a path; what it computes on the way, a key or a call, is not.
const calleeActing = (context: Context, callee: ts.Expression): ts.Node[] => {
  const value = unwrapped(callee);

  if (ts.isPropertyAccessExpression(value)) {
    return calleeActing(context, value.expression);
  }

  if (ts.isElementAccessExpression(value)) {
    const owner = calleeActing(context, value.expression);
    const key = actingIn(context, value.argumentExpression);
    const acting = [...owner, ...key];

    return acting;
  }

  return actingIn(context, value);
};

// Every node under a node that may act, as the code runs, without looking into a function, which runs only when
// called.
const actingIn = (context: Context, node: ts.Node): ts.Node[] => {
  if (ts.isCallExpression(node) && isPureCall(context, node)) {
    const callee = calleeActing(context, node.expression);
    const passed = node.arguments
      .flatMap((argument) => {
        return actingIn(context, argument);
      });
    const acting = [...callee, ...passed];

    return acting;
  }

  const acting = isActing(context, node) ? [node] : [];

  if (!ts.isFunctionLike(node)) {
    node
      .forEachChild((child) => {
        acting.push(...actingIn(context, child));
      });
  }

  return acting;
};

const contextOf = (proof: Proof): Context => {
  const context: Context = {
    proof,
    given: new Map(proof.given),
    calling: new Set(),
  };

  return context;
};

// What stops a member read from being proven to run no code; undefined when it is proven.
export const readFault = (proof: Proof, read: MemberRead): Fault | undefined => {
  const context = contextOf(proof);

  return readFaultIn(context, read);
};

// What stops reading every member of a value, as a spread does, from being proven to run no code.
export const spreadFault = (proof: Proof, spread: ts.Expression): Fault | undefined => {
  const context = contextOf(proof);

  return spreadFaultIn(context, spread);
};

// The code under a node not proven to run nothing: a call other than a proven or declared pure one, `new`, `await`,
// a tagged template, an assignment, an update, `delete`, or a member read or spread no proof covers.
export const actsIn = (proof: Proof, node: ts.Node): ts.Node[] => {
  const context = contextOf(proof);

  return actingIn(context, node);
};

// The test `isPure` takes for a member read.
export const plainReadOf = (proof: Proof): ((read: MemberRead) => boolean) => {
  return (read) => {
    return readFault(proof, read) === undefined;
  };
};

export const readRefusal = (node: ts.Node, { member, origin }: Fault): Error => {
  const read = `${member} of ${origin.shown} is not shown to be a plain property`;
  const reason = origin.isModule
    ? `${read}, so reading it may run code: give the engine that module, or declare it plain data`
    : `${read} of an object literal, so reading it may run code`;

  return refusal(node, reason);
};

// The member reads a node evaluates, inner first as they run; a function's body runs only when called.
const readsIn = (node: ts.Node): MemberRead[] => {
  const reads: MemberRead[] = [];

  if (ts.isFunctionLike(node)) {
    return reads;
  }

  node
    .forEachChild((child) => {
      reads.push(...readsIn(child));
    });

  if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) && !isWritten(node)) {
    reads.push(node);
  }

  return reads;
};

// A value the engine moves, repeats or drops may hold only member reads it can prove run no code.
export const plainCheck = (proof: Proof, node: ts.Node): void => {
  for (const read of readsIn(node)) {
    const fault = readFault(proof, read);

    if (fault !== undefined) {
      throw readRefusal(read, fault);
    }
  }
};

const isAnyRead = (): boolean => {
  return true;
};

// A value the engine moves, repeats or drops must be pure; when only member reads stand in the way, it says which.
export const pureCheck = (proof: Proof, value: ts.Expression, refused: Error): void => {
  const isPlain = plainReadOf(proof);

  if (isPure(value, isPlain)) {
    return;
  }

  if (isPure(value, isAnyRead)) {
    plainCheck(proof, value);
  }

  throw refused;
};
