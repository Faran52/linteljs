import ts from 'typescript';

import {
  exportOf,
  localsOf,
  resolved,
  type Sources,
} from './bindingUtils';
import { refusal } from './editUtils';
import { aliasedOf, declarationOf } from './scopeUtils';
import {
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
 * A member read runs code when the member is a getter, so it is taken to have no effect only on proof: the member is a
 * plain property of an object literal written in a file the engine holds, or the read goes through an import of a
 * module the request declares plain data. Anything else may act.
 */

export interface Proof {
  checker: ts.TypeChecker;
  sources: Sources;
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

interface Walk {
  proof: Proof;
  seen: Set<ts.Node>;
}

// A pattern matches a whole specifier, each `*` in it standing for any run of characters but `/`.
const isDeclaredPlain = (patterns: readonly string[], specifier: string): boolean => {
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

const faultAt = (path: readonly Key[], origin: Origin): Fault => {
  const [key] = path;
  const fault: Fault = {
    member: key === undefined ? 'every member' : key.shown,
    origin,
  };

  return fault;
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

// Reading a path from an object literal: each step a plain property of it, or every member at once for a spread.
const literalFault = (
  walk: Walk,
  table: ts.ObjectLiteralExpression,
  path: readonly Key[],
  origin: Origin,
): Fault | undefined => {
  const [key, ...rest] = path;

  if (key === undefined) {
    const isPlain = table.properties
      .every((property) => {
        return isValueMember(property) && keyOf(property) !== undefined && !isPrototype(property);
      });

    return isPlain ? undefined : faultAt(path, origin);
  }

  const member = key.name === undefined ? undefined : memberIn(table, key.name);

  if (member === undefined || !isValueMember(member) || keyOf(member) !== key.name || isPrototype(member)) {
    return faultAt(path, origin);
  }

  if (rest.length === 0) {
    return undefined;
  }

  const value = ts.isPropertyAssignment(member) ? member.initializer : member.name;

  return faultIn(walk, value, rest, origin);
};

// A `const` whose value a proof can follow; any other declaration may hold anything.
const declaredFault = (
  walk: Walk,
  declaration: ts.Declaration | undefined,
  path: readonly Key[],
  origin: Origin,
): Fault | undefined => {
  const isVariable = declaration !== undefined && ts.isVariableDeclaration(declaration);
  const flags = isVariable ? ts.getCombinedNodeFlags(declaration) : 0;
  const isConstant = (flags & ts.NodeFlags.Const) !== 0 && (flags & ts.NodeFlags.Using) === 0;
  const initializer = isVariable && isConstant ? declaration.initializer : undefined;

  return initializer === undefined ? faultAt(path, origin) : faultIn(walk, initializer, path, origin);
};

// A name that resolves to nothing in the body: a parameter binding, an import of the base, or a global.
const outsideFault = (walk: Walk, name: ts.Identifier, path: readonly Key[]): Fault | undefined => {
  const { sources } = walk.proof;
  const binding = sources.bindings.get(name.text);

  if (binding !== undefined) {
    const exported = resolved(sources, name.text);
    const origin = moduleOrigin(binding.specifier);

    return declaredFault(walk, exported, path, origin);
  }

  const entry = sources.imports
    .find((each) => {
      return localsOf(each).includes(name.text);
    });

  const origin = entry === undefined ? nameOrigin(name.text) : moduleOrigin(entry.specifier);

  if (entry === undefined) {
    return faultAt(path, origin);
  }

  if (isDeclaredPlain(sources.plainData, entry.specifier)) {
    return undefined;
  }

  const module = sources.held.get(entry.specifier);
  const exported = entry.names.get(name.text);
  const found = module === undefined || exported === undefined ? undefined : exportOf(module, exported);

  return declaredFault(walk, found, path, origin);
};

const nameFault = (walk: Walk, name: ts.Identifier, path: readonly Key[]): Fault | undefined => {
  const { checker, sources } = walk.proof;
  const declaration = declarationOf(checker, name);

  if (declaration === undefined) {
    return outsideFault(walk, name, path);
  }

  const statement = ts.findAncestor(declaration, ts.isImportDeclaration);

  if (statement === undefined) {
    const origin = nameOrigin(name.text);

    return declaredFault(walk, declaration, path, origin);
  }

  const specifier = textOf(statement.moduleSpecifier).slice(1, -1);

  if (isDeclaredPlain(sources.plainData, specifier)) {
    return undefined;
  }

  const target = aliasedOf(checker, name);
  const origin = moduleOrigin(specifier);

  return declaredFault(walk, target, path, origin);
};

// The first step of reading a path from what a node evaluates to that no proof covers.
const faultIn = (walk: Walk, node: ts.Expression, path: readonly Key[], origin: Origin): Fault | undefined => {
  const value = unwrapped(node);

  if (walk.seen.has(value)) {
    return faultAt(path, origin);
  }

  walk.seen.add(value);

  if (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) {
    const key = keyOfRead(value);

    return faultIn(walk, value.expression, [key, ...path], origin);
  }

  if (ts.isIdentifier(value)) {
    return nameFault(walk, value, path);
  }

  return ts.isObjectLiteralExpression(value) ? literalFault(walk, value, path, origin) : faultAt(path, origin);
};

const walkOf = (proof: Proof): Walk => {
  const walk: Walk = {
    proof,
    seen: new Set(),
  };

  return walk;
};

// What stops a member read from being proven to run no code; undefined when it is proven.
export const readFault = (proof: Proof, read: MemberRead): Fault | undefined => {
  const origin = nameOrigin(textOf(read.expression));
  const walk = walkOf(proof);
  const key = keyOfRead(read);

  return faultIn(walk, read.expression, [key], origin);
};

// What stops reading every member of a value, as a spread does, from being proven to run no code.
export const spreadFault = (proof: Proof, spread: ts.Expression): Fault | undefined => {
  const origin = nameOrigin(textOf(spread));
  const walk = walkOf(proof);

  return faultIn(walk, spread, [], origin);
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
