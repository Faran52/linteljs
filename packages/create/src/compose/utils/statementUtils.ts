import ts from 'typescript';

import { SEMICOLON_STATEMENTS } from '../constants';

import {
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
import { landedCheck } from './stepUtils';

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

// The statement that binds a call's result, and the binding.
interface Holder extends Landing {
  declaration: ts.VariableDeclaration;
}

const EMPTY_OBJECT = /^Record<never,\s*never>$/u;
const LEADING_BLANK_LINES = /^(?:[\t ]*\n)+/u;

const membersOf = (exported: ts.Node, use: ts.Node): readonly ts.TypeElement[] => {
  if (ts.isInterfaceDeclaration(exported)) {
    return exported.members;
  }

  const type = ts.isTypeAliasDeclaration(exported) ? exported.type : undefined;

  if (type !== undefined && ts.isTypeLiteralNode(type)) {
    return type.members;
  }

  const written = type === undefined ? '' : textOf(type);

  if (EMPTY_OBJECT.test(written)) {
    return [];
  }

  throw refusal(use, 'A type an interface extends must be an interface, a type literal or Record<never, never>');
};

const nameOf = (member: ts.TypeElement): string | undefined => {
  return member.name === undefined ? undefined : textOf(member.name);
};

// Where a member ends with the comments after it on its own line.
const commentedEnd = (node: ts.Node): number => {
  const trailing = ts.getTrailingCommentRanges(node.getSourceFile().text, node.getEnd());

  return trailing?.at(-1)?.end ?? node.getEnd();
};

// A member with its comments: those on the lines above it, and those after it on its own line.
const commentedOf = (member: ts.TypeElement): string => {
  const source = member.getSourceFile().text;
  const leading = ts.getLeadingCommentRanges(source, member.getFullStart());
  const start = leading?.at(0)?.pos ?? member.getStart();
  const end = commentedEnd(member);

  return source.slice(start, end);
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

  const isHeritage = ts.isExpressionWithTypeArguments(reference) && ts.isHeritageClause(clause);

  if (!isHeritage || !ts.isInterfaceDeclaration(target)) {
    throw refusal(local, 'An option type can only be used as a type an interface extends');
  }

  const last = target.members.at(-1);
  const indent = last === undefined ? `${indentOf(text, target)}  ` : indentOf(text, last);
  const exported = resolved(sources, local.text);
  const isGeneric = ts.isVariableDeclaration(exported) ? false : exported.typeParameters !== undefined;

  if (isGeneric || reference.typeArguments !== undefined) {
    throw refusal(reference, 'A type an interface extends takes no type arguments here');
  }

  const joining = membersOf(exported, local);
  const own = new Set(target.members.map(nameOf));
  const twice = joining
    .map(nameOf)
    .find((name) => {
      return name !== undefined && own.has(name);
    });

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

const returnsEarly = (statement: ts.Statement): boolean => {
  const owner = ts.findAncestor(statement, ts.isFunctionLike);

  return collect(statement, ts.isReturnStatement)
    .some((found) => {
      return ts.findAncestor(found, ts.isFunctionLike) === owner;
    });
};

// The names the spliced statements hand to the base: the plain members of the object they return.
const answeredNames = (returned: ts.ReturnStatement | undefined): ts.Identifier[] => {
  const answer = returned?.expression === undefined ? undefined : unparen(returned.expression);

  if (answer === undefined) {
    return [];
  }

  if (!ts.isObjectLiteralExpression(answer) || !answer.properties.every(ts.isShorthandPropertyAssignment)) {
    throw refusal(answer, 'Statements spliced into the base must answer an object of plain names');
  }

  return answer.properties
    .filter(ts.isShorthandPropertyAssignment)
    .map((property) => {
      return property.name;
    });
};

// `const y = f();` inside a block, when the call is all it holds.
const holderOf = (call: ts.CallExpression): Holder | undefined => {
  const declaration = call.parent;

  if (!ts.isVariableDeclaration(declaration)) {
    return undefined;
  }

  const statement = declaration.parent.parent;
  const block = statement.parent;

  if (!ts.isVariableStatement(statement) || !ts.isBlock(block) || statement.declarationList.declarations.length > 1) {
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
  answered: readonly ts.Identifier[],
): Edit[] => {
  const holder = textOf(declaration.name);

  return referencesTo(checker, declaration, container)
    .map((read) => {
      const access = read.parent;
      const name = ts.isPropertyAccessExpression(access)
        ? answered
            .find((candidate) => {
              return candidate.text === access.name.text;
            })
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
  const caught = ts.isCatchClause(owner) ? [owner.variableDeclaration?.name] : [];

  const names = [...parameters, ...caught];

  return names
    .flatMap((name) => {
      return name === undefined ? [] : bindingNamesOf(name);
    });
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
  answered: readonly ts.Identifier[],
): Edit[] => {
  const { name } = holder.declaration;

  if (ts.isIdentifier(name)) {
    return holderReads(checker, sources, arrow, holder, answered);
  }

  const names = answered
    .map((identifier) => {
      return identifier.text;
    });
  const elements = ts.isObjectBindingPattern(name) ? name.elements : undefined;
  const isAnswered = elements
    ?.every((element) => {
      const named = textOf(element.name);

      return isPlainElement(element) && names.includes(named);
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
  const first = kept.at(0);
  const last = kept.at(-1);

  if (first === undefined || last === undefined) {
    return '';
  }

  const source = first.getSourceFile().text;
  const end = last.getEnd();
  // Base code follows the block, so a semicolon left to insertion could join the next line to it.
  const isOpen = SEMICOLON_STATEMENTS.has(last.kind) && last.getLastToken()?.kind !== ts.SyntaxKind.SemicolonToken;
  const closing = isOpen ? ';' : '';
  const statements = source.slice(first.getFullStart(), end);
  const comments = isLineEnd ? source.slice(end, commentedEnd(last)) : '';
  const block = (statements + closing + comments).replace(LEADING_BLANK_LINES, '');
  const from = leadingIndent(block);
  const body = block.slice(from.length);

  return reindent(body, from, indent);
};

const isAwaiting = (node: ts.Node): node is ts.Node => {
  const isForAwait = ts.isForOfStatement(node) && node.awaitModifier !== undefined;
  const isAwaitUsing = ts.isVariableDeclarationList(node)
    && node.getFirstToken()?.kind === ts.SyntaxKind.AwaitKeyword;

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

// Option code moved to where it lands may not change what it or the base reads there.
const landingCheck = (
  checker: ts.TypeChecker,
  sources: Sources,
  kept: readonly ts.Statement[],
  arrow: ts.ArrowFunction,
  landing: Landing,
): void => {
  varCheck(kept, arrow);
  clashCheck(sources, kept, landing);

  for (const moved of kept) {
    landedCheck(checker, sources, arrow, moved, landing.statement);
  }

  takenOverCheck(checker, kept, landing);
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

  argumentsCheck(kept, arrow, call);
  awaitCheck(kept, arrow, call);
  landingCheck(checker, sources, kept, arrow, landing);

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
  landingCheck(checker, sources, kept, arrow, holder);

  const answered = answeredNames(returned);
  const reads = readsOf(checker, sources, arrow, holder, answered);
  const edits = [...reads, splicedOver(text, kept, holder.statement)];

  return edits;
};
