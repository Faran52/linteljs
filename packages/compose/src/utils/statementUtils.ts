import ts from 'typescript';

import {
  SEMICOLON_STATEMENTS,
  TYPE_LEVEL,
  TYPE_LEVELS,
  TYPE_ROOMS,
} from '../constants';

import {
  type Exported,
  exportsOf,
  localsOf,
  resolved,
  type Sources,
} from './bindingUtils';
import {
  arrowOf,
  functionOf,
  inlineCall,
} from './callUtils';
import {
  copyOf,
  type Edit,
  editOf,
  editOver,
  joined,
  plain,
  refusal,
  separated,
  takenOut,
} from './editUtils';
import {
  bindingNamesOf,
  declarationOf,
  declaredBy,
  referencesTo,
  resolvedAt,
} from './scopeUtils';
import {
  collect,
  hasModifier,
  indentOf,
  isAsync,
  isPlainElement,
  isReference,
  isWithin,
  leadingIndent,
  lineEnd,
  linesGone,
  ownsLines,
  reindent,
  type Span,
  spanOf,
  textOf,
  unparen,
} from './sourceUtils';
import {
  landedCheck,
  outsideReads,
  readsCheck,
} from './stepUtils';

// Where spliced statements land: the statement they replace, and the block or file holding it.
interface Landing {
  statement: ts.Statement;
  container: ts.Block | ts.SourceFile;
}

// An option function called as a statement, and the statements of its body.
interface Case {
  arrow: ts.ArrowFunction;
  kept: readonly ts.Statement[];
}

// The class a base declares, and the clause that extends an option's class.
interface Extending {
  target: ts.ClassDeclaration;
  clause: ts.HeritageClause;
}

// The statement that binds a call's result, and the binding.
interface Holder extends Landing {
  declaration: ts.VariableDeclaration;
}

const LEADING_OPERATOR = /^[&|]/u;
const BLANK_LINE = /^[\t ]*\n[\t ]*\n/u;
const EMPTY_OBJECT = /^Record<never,\s*never>$/u;
const LEADING_BLANK_LINES = /^(?:[\t ]*\n)+/u;
const PLAIN_ANSWER = 'Statements spliced into the base must answer an object of plain names';
const NOT_MEMBERS = 'A type an interface extends must be an interface, a type literal or Record<never, never>';

const membersOf = (exported: ts.Node, use: ts.Node): readonly ts.TypeElement[] => {
  if (ts.isInterfaceDeclaration(exported)) {
    return exported.members;
  }

  if (!ts.isTypeAliasDeclaration(exported)) {
    throw refusal(use, NOT_MEMBERS);
  }

  const { type } = exported;

  if (ts.isTypeLiteralNode(type)) {
    return type.members;
  }

  const written = textOf(type);

  if (EMPTY_OBJECT.test(written)) {
    return [];
  }

  throw refusal(use, NOT_MEMBERS);
};

// The name a member is read by; a key written as a name or as a literal is one member.
const nameOf = ({ name }: ts.ClassElement | ts.TypeElement): string | undefined => {
  if (name === undefined || ts.isComputedPropertyName(name)) {
    return name === undefined ? undefined : textOf(name);
  }

  return name.text;
};

// The member both declare, or undefined.
const sharedName = (
  base: readonly (ts.ClassElement | ts.TypeElement)[],
  option: readonly (ts.ClassElement | ts.TypeElement)[],
): string | undefined => {
  const own = new Set(base.map(nameOf));

  return option
    .map(nameOf)
    .find((name) => {
      return own.has(name);
    });
};

// Where a member ends with the comments after it on its own line.
const commentedEnd = (node: ts.Node): number => {
  const trailing = ts.getTrailingCommentRanges(node.getSourceFile().text, node.getEnd());

  const last = trailing?.at(-1);

  return last === undefined ? node.getEnd() : last.end;
};

// A member with its comments: those on the lines above it, and those after it on its own line.
const commentedSpan = (member: ts.Node): Span => {
  const leading = ts.getLeadingCommentRanges(member.getSourceFile().text, member.getFullStart());
  const first = leading?.at(0);
  const span: Span = {
    start: first === undefined ? member.getStart() : first.pos,
    end: commentedEnd(member),
  };

  return span;
};

const commentedOf = (member: ts.TypeElement): string => {
  const { start, end } = commentedSpan(member);

  return member
    .getSourceFile()
    .text
    .slice(start, end);
};

// The loosest type that can stand where a reference stands without parentheses.
const typeRoomAt = (reference: ts.TypeReferenceNode): number => {
  const { parent } = reference;

  if (ts.isIndexedAccessTypeNode(parent)) {
    return parent.objectType === reference ? TYPE_LEVEL.whole : TYPE_LEVEL.loose;
  }

  if (ts.isConditionalTypeNode(parent)) {
    const isCompared = parent.checkType === reference || parent.extendsType === reference;

    return isCompared ? TYPE_LEVEL.union : TYPE_LEVEL.loose;
  }

  return TYPE_ROOMS.get(parent.kind) ?? TYPE_LEVEL.loose;
};

// `x: X` of an option `type X = T` is `x: T`.
export const inlineAlias = (
  text: string,
  sources: Sources,
  local: ts.Identifier,
  reference: ts.TypeReferenceNode,
  checker: ts.TypeChecker,
): Edit[] => {
  const exported = resolved(sources, local.text);

  if (!ts.isTypeAliasDeclaration(exported)) {
    throw refusal(local, 'An option type read as a type must be a type alias');
  }

  if (exported.typeParameters !== undefined || reference.typeArguments !== undefined) {
    throw refusal(reference, 'An option type read as a type takes no type arguments here');
  }

  const { type } = exported;

  landedCheck(checker, sources, type, type, reference);

  const from = indentOf(exported.getSourceFile().text, exported);
  const to = indentOf(text, reference);
  const own = reindent(textOf(type), from, to);
  // `A | | B` does not parse, so a type that opens with its operator is never a bare part of another.
  const level = LEADING_OPERATOR.test(own) ? TYPE_LEVEL.loose : TYPE_LEVELS.get(type.kind) ?? TYPE_LEVEL.whole;
  const written = plain(level < typeRoomAt(reference) ? `(${own})` : own);
  const edits = [editOver(reference, written)];

  return edits;
};

// `interface I extends X`: the option's members join I's own, and the clause goes.
export const flattenHeritage = (
  text: string,
  sources: Sources,
  local: ts.Identifier,
  checker: ts.TypeChecker,
): Edit[] => {
  const reference = local.parent;
  const clause = reference.parent;
  const target = clause.parent;

  if (!ts.isHeritageClause(clause) || !ts.isInterfaceDeclaration(target)) {
    throw refusal(local, 'An option type can only be used as a type an interface extends');
  }

  const last = target.members.at(-1);
  const indent = last === undefined ? `${indentOf(text, target)}  ` : indentOf(text, last);
  const exported = resolved(sources, local.text);
  const isGeneric = ts.isVariableDeclaration(exported) ? false : exported.typeParameters !== undefined;

  const isTyped = clause.types
    .some((type) => {
      return type === reference && type.typeArguments !== undefined;
    });

  if (isGeneric || isTyped) {
    throw refusal(reference, 'A type an interface extends takes no type arguments here');
  }

  const joining = membersOf(exported, local);
  const twice = sharedName(target.members, joining);

  if (twice !== undefined) {
    throw refusal(target.name, `Both the base and the option declare the member "${twice}" of`);
  }

  for (const member of joining) {
    landedCheck(checker, sources, member, member, target);
  }

  const members = joining
    .map((member) => {
      const from = indentOf(member.getSourceFile().text, member);
      const moved = reindent(commentedOf(member), from, indent);

      return `\n${indent}${moved}`;
    });
  const open = text.indexOf('{', clause.getEnd());
  const at = last === undefined ? open + 1 : commentedEnd(last);
  const others = clause.types
    .filter((type) => {
      return type !== reference;
    })
    .map(copyOf);
  const listed = separated(others, ', ');
  const extending = plain(' extends ');
  const kept = others.length === 0 ? listed : joined([extending, listed]);
  const added: Span = {
    start: at,
    end: at,
  };
  const clauseSpan: Span = {
    start: clause.getFullStart(),
    end: clause.getEnd(),
  };

  const appended = plain(members.join(''));
  const edits = [editOf(added, appended), editOf(clauseSpan, kept)];

  return edits;
};

// The class a base declares as `class C extends x`, or undefined where the name is read otherwise.
export const extendingOf = (local: ts.Identifier): Extending | undefined => {
  const clause = local.parent.parent;

  if (!ts.isHeritageClause(clause) || !ts.isClassDeclaration(clause.parent)) {
    return undefined;
  }

  const extending: Extending = {
    target: clause.parent,
    clause,
  };

  return clause.token === ts.SyntaxKind.ExtendsKeyword ? extending : undefined;
};

const isSuper = (node: ts.Node): node is ts.Node => {
  return node.kind === ts.SyntaxKind.SuperKeyword;
};

const isDecorated = (node: ts.Node): boolean => {
  return ts.canHaveDecorators(node) && ts.getDecorators(node) !== undefined;
};

const isInstanceMember = (member: ts.ClassElement): boolean => {
  const isOther = ts.isConstructorDeclaration(member) || ts.isClassStaticBlockDeclaration(member);

  const isStatic = hasModifier(member, ts.SyntaxKind.StaticKeyword);
  const isAbstract = hasModifier(member, ts.SyntaxKind.AbstractKeyword);

  return !isOther && !isStatic && !isAbstract;
};

// The members an option's class gives another: instance members, with nothing else to the class.
const givenMembers = (
  exported: Exported,
  local: ts.Identifier,
  clause: ts.HeritageClause,
): readonly ts.ClassElement[] => {
  if (!ts.isClassDeclaration(exported)) {
    throw refusal(local, 'What a class extends must be a class its option exports');
  }

  const isTyped = exported.typeParameters !== undefined || clause.types
    .some((type) => {
      return type.typeArguments !== undefined;
    });

  if (isTyped) {
    throw refusal(clause, 'A class a base extends takes no type arguments here');
  }

  const isAbstract = hasModifier(exported, ts.SyntaxKind.AbstractKeyword);
  const isDeclared = hasModifier(exported, ts.SyntaxKind.DeclareKeyword);
  const isConcrete = !isAbstract && !isDeclared;
  const isPlainClass = isConcrete && exported.heritageClauses === undefined && clause.types.length === 1;
  const hasDecorator = [exported, ...exported.members].some(isDecorated);

  if (!isPlainClass || hasDecorator || !exported.members.every(isInstanceMember)) {
    throw refusal(clause, 'A class a base extends is concrete and holds instance members, no heritage or decorator');
  }

  const { text } = exported.getSourceFile();
  const end = exported.getEnd();
  const closing: Span = {
    start: end - 1,
    end,
  };
  const spans = [...exported.members.map(commentedSpan), closing];
  let at = exported.members.pos;

  for (const span of spans) {
    if (text
      .slice(at, span.start)
      .trim() !== '') {
      throw refusal(clause, 'A class a base extends holds a comment no member carries, which would be lost');
    }

    at = span.end;
  }

  return exported.members;
};

// A member as it lands; a field's semicolon is written, since what follows it there is another's.
const memberText = (member: ts.ClassElement, indent: string): string => {
  const source = member.getSourceFile().text;
  const { start, end } = commentedSpan(member);
  const at = member.getEnd();
  const written = source.slice(start, at);
  const isOpen = ts.isPropertyDeclaration(member) && !written.endsWith(';');
  const closing = isOpen ? ';' : '';
  const from = indentOf(source, member);
  const moved = reindent(written + closing + source.slice(at, end), from, indent);

  return `${indent}${moved}`;
};

// What follows the landed members: a blank line before the base's own first member.
const followingOf = (rest: string, hasMember: boolean, indent: string): string => {
  const isBroken = rest.includes('\n');

  if (!hasMember) {
    return isBroken ? rest : `\n${indent}`;
  }

  if (!isBroken) {
    return `\n\n${indent}`;
  }

  return BLANK_LINE.test(rest) ? rest : `\n${rest}`;
};

// `class C extends X`: the members of the option's class land first in C, and the clause goes.
export const flattenClass = (
  text: string,
  sources: Sources,
  local: ts.Identifier,
  { target, clause }: Extending,
  checker: ts.TypeChecker,
): Edit[] => {
  const given = givenMembers(resolved(sources, local.text), local, clause);
  const twice = sharedName(target.members, given);
  const parent = collect(target, isSuper)
    .find((found) => {
      return ts.findAncestor(found, ts.isClassLike) === target;
    });

  if (twice !== undefined) {
    throw refusal(target, `Both the base and the option declare the member "${twice}" of`);
  }

  if (parent !== undefined) {
    throw refusal(parent.parent, 'A class that loses the option class it extends may not read "super"');
  }

  for (const member of given) {
    landedCheck(checker, sources, member, member, target);
  }

  const clauseSpan: Span = {
    start: clause.getFullStart(),
    end: clause.getEnd(),
  };
  const gone = takenOut(clauseSpan);

  if (given.length === 0) {
    const alone = [gone];

    return alone;
  }

  const open = target.members.pos;
  const first = target.members.at(0);
  const start = ts.getTrailingCommentRanges(text, open)?.at(-1)?.end ?? open;
  const end = first === undefined ? target.getEnd() - 1 : commentedSpan(first).start;
  const rest = text.slice(start, end);
  const classIndent = indentOf(text, target);
  const isFirstLed = first !== undefined && rest.includes('\n');
  const indent = isFirstLed ? indentOf(text, first) : `${classIndent}  `;
  const members = given
    .map((member) => {
      return memberText(member, indent);
    })
    .join('\n\n');
  const following = followingOf(rest, first !== undefined, first === undefined ? classIndent : indent);
  const landing: Span = {
    start,
    end,
  };
  const landed = plain(`\n${members}${following}`);
  const edits = [gone, editOf(landing, landed)];

  return edits;
};

const returnsEarly = (statement: ts.Statement): boolean => {
  const owner = ts.findAncestor(statement, ts.isFunctionLike);

  return collect(statement, ts.isReturnStatement)
    .some((found) => {
      return ts.findAncestor(found, ts.isFunctionLike) === owner;
    });
};

// The names the spliced statements hand to the base: the plain members of the object they return.
const answeredNames = (returned: ts.ReturnStatement | undefined): ReadonlyMap<string, ts.Identifier> => {
  const answer = returned?.expression === undefined ? undefined : unparen(returned.expression);

  if (answer === undefined) {
    return new Map();
  }

  if (!ts.isObjectLiteralExpression(answer)) {
    throw refusal(answer, PLAIN_ANSWER);
  }

  const entries = answer.properties
    .map((property) => {
      if (!ts.isShorthandPropertyAssignment(property)) {
        throw refusal(answer, PLAIN_ANSWER);
      }

      const entry: [string, ts.Identifier] = [property.name.text, property.name];

      return entry;
    });

  return new Map(entries);
};

// `const y = f();` inside a block, when the call is all it holds.
const holderOf = (call: ts.CallExpression): Holder | undefined => {
  const statement = ts.findAncestor(call, ts.isVariableStatement);

  if (statement === undefined) {
    return undefined;
  }

  const block = statement.parent;
  const { declarations } = statement.declarationList;
  const declaration = declarations
    .find((candidate) => {
      return candidate.initializer === call;
    });

  if (!ts.isBlock(block) || declaration === undefined || declarations.length > 1) {
    return undefined;
  }

  const holder: Holder = {
    statement,
    declaration,
    container: block,
  };

  return holder;
};

// Each read of the holder becomes the plain name the option's statements answered, which must read the same there.
const holderReads = (
  checker: ts.TypeChecker,
  sources: Sources,
  arrow: ts.ArrowFunction,
  { declaration, container }: Holder,
  answered: ReadonlyMap<string, ts.Identifier>,
): Edit[] => {
  const holder = textOf(declaration.name);

  return referencesTo(checker, declaration, container)
    .map((read) => {
      const access = read.parent;
      const name = ts.isPropertyAccessExpression(access)
        ? answered.get(access.name.text)
        : undefined;

      if (name === undefined) {
        throw refusal(access, `"${holder}" can only be read by a member the option's statements answer`);
      }

      const found = resolvedAt(checker, name, access);

      landedCheck(checker, sources, arrow, name, access);

      if (found !== undefined && found !== declaration && isWithin(found, container)) {
        throw refusal(access, `"${name.text}" is bound again around this read, so the option's one cannot land here`);
      }

      const short = plain(name.text);

      return editOver(access, short);
    });
};

const returnCheck = (kept: readonly ts.Statement[], arrow: ts.ArrowFunction): void => {
  if (kept.some(returnsEarly)) {
    throw refusal(arrow, 'Statements spliced into the base may only return at the end');
  }
};

const varCheck = (kept: readonly ts.Statement[], arrow: ts.ArrowFunction): void => {
  const hasVar = kept
    .some((statement) => {
      return collect(statement, ts.isVariableDeclarationList)
        .some((list) => {
          return (list.flags & ts.NodeFlags.BlockScoped) === 0;
        });
    });

  if (hasVar) {
    throw refusal(arrow, 'Statements spliced into the base must declare with const or let, never var');
  }
};

// The names a block's opener binds in it: the function's parameters or the caught error; a file's are its imports.
const openedBy = (sources: Sources, container: ts.Block | ts.SourceFile): string[] => {
  if (ts.isSourceFile(container)) {
    return sources.imports.flatMap(localsOf);
  }

  const owner = container.parent;
  const parameters = ts.isFunctionLike(owner)
    ? owner.parameters
        .map((parameter) => {
          return parameter.name;
        })
    : [];
  // Of the nodes opening a block, only a catch clause holds a variable declaration as a child of its own.
  const caught = owner
    .getChildren()
    .filter(ts.isVariableDeclaration)
    .map((declaration) => {
      return declaration.name;
    });
  const names = [...parameters, ...caught];

  return names.flatMap(bindingNamesOf);
};

// A spliced name may not be declared again in the scope it lands in: the block, or the function or catch it opens, or
// the file with the imports the composed module will hold.
const clashCheck = (sources: Sources, kept: readonly ts.Statement[], { statement, container }: Landing): void => {
  const others = container.statements
    .filter((candidate) => {
      return candidate !== statement;
    });
  const opened = openedBy(sources, container);
  const taken = declaredBy(others).union(new Set(opened));
  const clash = [...declaredBy(kept)]
    .find((name) => {
      return taken.has(name);
    });

  if (clash !== undefined) {
    throw refusal(statement, `The option's statements declare "${clash}", which the base already binds here`);
  }
};

// A spliced name takes over every read of it in the block that meant a binding from outside the block.
const takenOverCheck = (checker: ts.TypeChecker, kept: readonly ts.Statement[], landing: Landing): void => {
  const { statement, container } = landing;
  const names = declaredBy(kept);
  const read = collect(container, ts.isIdentifier)
    .find((identifier) => {
      const isOutside = names.has(identifier.text) && isReference(identifier) && !isWithin(identifier, statement);

      if (!isOutside) {
        return false;
      }

      const found = declarationOf(checker, identifier);

      return found === undefined || !isWithin(found, container);
    });

  if (read !== undefined) {
    throw refusal(read, `The option's statements declare "${read.text}", which the base reads from outside the block`);
  }
};

// The edits that make the base read the option's names: `y.k` to `k`, or none when a pattern already names them.
const readsOf = (
  checker: ts.TypeChecker,
  sources: Sources,
  arrow: ts.ArrowFunction,
  holder: Holder,
  answered: ReadonlyMap<string, ts.Identifier>,
): Edit[] => {
  const { name } = holder.declaration;

  if (ts.isIdentifier(name)) {
    return holderReads(checker, sources, arrow, holder, answered);
  }

  const elements = ts.isObjectBindingPattern(name) ? name.elements : undefined;
  const isAnswered = elements
    ?.every((element) => {
      const named = textOf(element.name);

      return isPlainElement(element) && answered.has(named);
    });

  if (isAnswered !== true) {
    throw refusal(name, 'A pattern can only take, by their own names, what the option\'s statements answer');
  }

  return [];
};

/**
 * The kept statements as one block of text, moved to the indentation of the statement they replace.
 * The comments after the last statement on its line are kept only where nothing follows on the line they land on, which
 * a line comment would swallow.
 */
const blockOf = (kept: readonly ts.Statement[], indent: string, isLineEnd: boolean): string => {
  const last = kept.at(-1);

  if (last === undefined) {
    return '';
  }

  const source = last.getSourceFile().text;
  const end = last.getEnd();
  // Base code follows the block, so a semicolon left to insertion could join the next line to it.
  const written = last.getText();
  const isOpen = SEMICOLON_STATEMENTS.has(last.kind) && !written.endsWith(';');
  const closing = isOpen ? ';' : '';
  const statements = kept
    .map((statement) => {
      return statement.getFullText();
    })
    .join('');
  const comments = isLineEnd ? source.slice(end, commentedEnd(last)) : '';
  const block = (statements + closing + comments).replace(LEADING_BLANK_LINES, '');
  const from = leadingIndent(block);
  const body = block.slice(from.length);

  return reindent(body, from, indent);
};

const isAwaiting = (node: ts.Node): node is ts.Node => {
  const isForAwait = ts.isForOfStatement(node) && node.awaitModifier !== undefined;
  // Only a declaration list carries these flags.
  const isAwaitUsing = (node.flags & ts.NodeFlags.Const) !== 0 && (node.flags & ts.NodeFlags.Using) !== 0;

  return ts.isAwaitExpression(node) || isForAwait || isAwaitUsing;
};

// An async case is awaited by the base, a sync one is not, and what the case awaits lands in an async function.
const awaitCheck = (kept: readonly ts.Statement[], arrow: ts.ArrowFunction, call: ts.CallExpression): void => {
  const isAwaited = ts.isAwaitExpression(call.parent);

  if (isAwaited && !isAsync(arrow)) {
    throw refusal(call, 'Only an async case is awaited where the base calls it');
  }

  if (!isAwaited && isAsync(arrow)) {
    throw refusal(call, 'An async case is spliced only where the base awaits its call');
  }

  const host = ts.findAncestor(call, ts.isFunctionLike);
  const awaits = kept
    .some((statement) => {
      return collect(statement, isAwaiting)
        .some((found) => {
          return ts.findAncestor(found, ts.isFunctionLike) === arrow;
        });
    });

  if (awaits && (host === undefined || !isAsync(host))) {
    throw refusal(call, 'An awaited statement is spliced only into an async function');
  }
};

const isPlainParameter = (parameter: ts.ParameterDeclaration): boolean => {
  const isBare = parameter.initializer === undefined && parameter.dotDotDotToken === undefined;

  return isBare && parameter.questionToken === undefined;
};

// A case takes each argument as the base's binding of the parameter's own name, and declares none of those names; a
// pattern's text is never an argument's name.
const argumentsCheck = (kept: readonly ts.Statement[], arrow: ts.ArrowFunction, call: ts.CallExpression): void => {
  const names = arrow.parameters
    .map((parameter) => {
      return textOf(parameter.name);
    });
  const passed = call.arguments
    .map((argument) => {
      return ts.isIdentifier(argument) ? argument.text : undefined;
    });
  const isByName = names.length === passed.length && arrow.parameters.every(isPlainParameter);
  const unnamed = names
    .find((name, index) => {
      return passed[index] !== name;
    });

  if (!isByName || unnamed !== undefined) {
    throw refusal(call, 'A case takes each argument as a name the base passes under the parameter\'s own name');
  }

  const declared = declaredBy(kept);
  const twice = names
    .find((name) => {
      return declared.has(name);
    });

  if (twice !== undefined) {
    throw refusal(call, `The case declares "${twice}", the name of its own parameter`);
  }
};

// `f(a);`, or `await f(a);` of an async case, written as its own statement in a block or at the file's top level.
export const caseOf = (call: ts.CallExpression): Landing | undefined => {
  const { parent } = call;
  const statement = ts.isAwaitExpression(parent) ? parent.parent : parent;
  const container = statement.parent;

  if (!ts.isExpressionStatement(statement)) {
    return undefined;
  }

  if (ts.isBlock(container) || ts.isSourceFile(container)) {
    const landing: Landing = {
      statement,
      container,
    };

    return landing;
  }

  return undefined;
};

// The statements' text where the statement they replace stood, its lines gone when they are none.
const splicedOver = (text: string, kept: readonly ts.Statement[], statement: ts.Statement): Edit => {
  const indent = indentOf(text, statement);
  const span = spanOf(statement);
  const after = text.slice(span.end, lineEnd(text, span.end));
  const block = blockOf(kept, indent, after.trim() === '');
  const gone = block === '' && ownsLines(text, span) ? linesGone(text, span) : span;
  const spliced = plain(block);

  return editOf(gone, spliced);
};

// Option code moved to where it lands may not change what it or the base reads there; `readsOf` answers the reads of
// each statement that must read the same there.
const landingCheck = (
  checker: ts.TypeChecker,
  sources: Sources,
  kept: readonly ts.Statement[],
  arrow: ts.ArrowFunction,
  landing: Landing,
  readsOf: (moved: ts.Statement) => ts.Identifier[],
): void => {
  varCheck(kept, arrow);
  clashCheck(sources, kept, landing);

  for (const moved of kept) {
    readsCheck(checker, sources, moved, readsOf(moved), landing.statement);
  }

  takenOverCheck(checker, kept, landing);
};

// The names the other cases of a case's option module declare in their own bodies.
const declaredByOthers = (arrow: ts.ArrowFunction): Set<string> => {
  const module = arrow.getSourceFile();
  const bodies = exportsOf(module)
    .flatMap((exported) => {
      const value = ts.isVariableDeclaration(exported) ? exported.initializer : undefined;
      const isOther = value !== undefined && value !== arrow && ts.isArrowFunction(value);
      const body = isOther && ts.isBlock(value.body) ? [value.body.statements] : [];

      return body;
    });

  const statements = bodies.flat();

  return declaredBy(statements);
};

// Two cases of one option may not declare one name, so a name a case declares has one binding wherever it is read.
const twiceCheck = (kept: readonly ts.Statement[], others: ReadonlySet<string>, call: ts.CallExpression): void => {
  const [twice] = declaredBy(kept)
    .intersection(others);

  if (twice !== undefined) {
    throw refusal(call, `Two cases of one option declare "${twice}"`);
  }
};

// The case's reads of names from outside it, less those of a name another case of its option declares: each of those
// must resolve, where it lands, to that case's binding at the top level, spliced before it.
const unsharedReads = (
  checker: ts.TypeChecker,
  sources: Sources,
  arrow: ts.ArrowFunction,
  landing: Landing,
  others: ReadonlySet<string>,
): (moved: ts.Statement) => ts.Identifier[] => {
  const module = arrow.getSourceFile();
  const file = landing.statement.getSourceFile();

  return (moved) => {
    return outsideReads(checker, arrow, moved)
      .filter((read) => {
        const name = read.text;
        const origin = declarationOf(checker, read);

        // A name its own module binds is not shared. A base with no import or export is a script, whose top-level
        // names its option modules see as globals.
        if (!others.has(name) || origin?.getSourceFile() === module) {
          return true;
        }

        if (sources.spliced.get(name) !== module) {
          const reason = `"${name}" is declared by another case of its option, not spliced at the top level before it`;

          throw refusal(landing.statement, reason);
        }

        const top = resolvedAt(checker, read, file);

        if (top === undefined || resolvedAt(checker, read, landing.statement) !== top) {
          const reason = `"${name}" does not read, where the case lands, what another case of its option declares`;

          throw refusal(landing.statement, reason);
        }

        return false;
      });
  };
};

// `cases(a);`: the case's statements replace the statement, each parameter read as the argument of its name.
const spliceCase = (
  text: string,
  sources: Sources,
  { arrow, kept }: Case,
  call: ts.CallExpression,
  checker: ts.TypeChecker,
  landing: Landing,
): Edit[] => {
  if (kept.some(returnsEarly)) {
    throw refusal(arrow, 'A case called as a statement may not return');
  }

  const others = declaredByOthers(arrow);
  const readsOf = unsharedReads(checker, sources, arrow, landing, others);

  argumentsCheck(kept, arrow, call);
  awaitCheck(kept, arrow, call);
  twiceCheck(kept, others, call);

  landingCheck(checker, sources, kept, arrow, landing, readsOf);

  // A top-level case is filled alone, so these edits are the ones applied; clashCheck keeps each name there one
  // binding.
  if (ts.isSourceFile(landing.container)) {
    for (const name of declaredBy(kept)) {
      sources.spliced.set(name, arrow.getSourceFile());
    }
  }

  const edits = [splicedOver(text, kept, landing.statement)];

  return edits;
};

// `const y = f();`: the option's statements replace the statement, and `y.k` becomes `k`.
export const spliceStatements = (
  text: string,
  sources: Sources,
  local: ts.Identifier,
  call: ts.CallExpression,
  checker: ts.TypeChecker,
): Edit[] => {
  const landing = caseOf(call);
  const option = functionOf(sources, local);

  if (landing !== undefined && ts.isBlock(option.body)) {
    const found: Case = {
      arrow: option,
      kept: option.body.statements,
    };

    return spliceCase(text, sources, found, call, checker, landing);
  }

  const arrow = arrowOf(sources, local);
  const holder = holderOf(call);

  if (holder === undefined || !ts.isBlock(arrow.body)) {
    return inlineCall(text, sources, local, call, checker);
  }

  if (arrow.parameters.length > 0 || call.arguments.length > 0) {
    throw refusal(call, 'Statements spliced into the base take no parameters');
  }

  const final = arrow.body.statements.at(-1);
  const returned = final !== undefined && ts.isReturnStatement(final) ? final : undefined;
  const kept = returned === undefined ? arrow.body.statements : arrow.body.statements.slice(0, -1);

  returnCheck(kept, arrow);

  landingCheck(checker, sources, kept, arrow, holder, (moved) => {
    return outsideReads(checker, arrow, moved);
  });

  const answered = answeredNames(returned);
  const reads = readsOf(checker, sources, arrow, holder, answered);
  const edits = [...reads, splicedOver(text, kept, holder.statement)];

  return edits;
};
