import ts from 'typescript';

import { resolved, type Sources } from './bindingUtils';
import { arrowOf, inlineCall } from './callUtils';
import {
  applied,
  type Edit,
  refusal,
} from './editUtils';
import {
  boundIn,
  collect,
  indentOf,
  isPlainElement,
  leadingIndent,
  referencesIn,
  reindent,
  spanOf,
  swapped,
  textOf,
  unparen,
  withoutLines,
} from './sourceUtils';

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

// `interface I extends X`: the option's members join I's own, and the clause goes.
export const flattenHeritage = (text: string, sources: Sources, local: ts.Identifier): string => {
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

  const members = joining
    .map((member) => {
      const from = indentOf(member.getSourceFile().text, member);
      const moved = reindent(textOf(member), from, indent);

      return `\n${indent}${moved}`;
    });
  const open = text.indexOf('{', clause.getEnd());
  const at = last === undefined ? open + 1 : last.getEnd();
  const others = clause.types
    .filter((type) => {
      return type !== reference;
    })
    .map(textOf);
  const kept = others.length === 0 ? '' : ` extends ${others.join(', ')}`;
  const edits: Edit[] = [
    {
      start: at,
      end: at,
      insert: members.join(''),
    },
    {
      start: clause.getFullStart(),
      end: clause.getEnd(),
      insert: kept,
    },
  ];

  return applied(text, edits);
};

const returnsEarly = (statement: ts.Statement): boolean => {
  const owner = ts.findAncestor(statement, ts.isFunctionLike);

  return collect(statement, ts.isReturnStatement)
    .some((found) => {
      return ts.findAncestor(found, ts.isFunctionLike) === owner;
    });
};

// The names the spliced statements hand to the base: the plain members of the object they return.
const answeredNames = (returned: ts.ReturnStatement | undefined): string[] => {
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
      return property.name.text;
    });
};

// The statement that binds a call's result, when the call is all it holds: `const y = f();` inside a block.
const holderOf = (call: ts.CallExpression): ts.VariableStatement | undefined => {
  const declaration = call.parent;
  const statement = ts.isVariableDeclaration(declaration) ? declaration.parent.parent : undefined;
  const held = statement !== undefined && ts.isVariableStatement(statement) ? statement : undefined;
  const isAlone = held?.declarationList.declarations.length === 1;

  return held !== undefined && isAlone && ts.isBlock(held.parent) ? held : undefined;
};

// Each read of the holder becomes the plain name the option's statements answered.
const holderReads = (scope: ts.Node, holder: string, names: readonly string[]): Edit[] => {
  return referencesIn(scope, holder)
    .map((read) => {
      const access = read.parent;

      if (!ts.isPropertyAccessExpression(access) || !names.includes(access.name.text)) {
        throw refusal(access, `"${holder}" can only be read by a member the option's statements answer`);
      }

      const edit: Edit = {
        ...spanOf(access),
        insert: access.name.text,
      };

      return edit;
    });
};

const clashCheck = (kept: readonly ts.Statement[], statement: ts.Statement): void => {
  const owner = ts.findAncestor(statement, ts.isFunctionLike) ?? statement.parent;
  const taken = boundIn(owner, statement);
  const clash = kept
    .flatMap((candidate) => {
      const names = boundIn(candidate);
      const declared = Array.from(names);

      return declared;
    })
    .find((name) => {
      return taken.has(name);
    });

  if (clash !== undefined) {
    throw refusal(statement, `The option's statements declare "${clash}", which the base already binds here`);
  }
};

// The edits that make the base read the option's names: `y.k` to `k`, or none when a pattern already names them.
const readsOf = (scope: ts.Node, holder: ts.BindingName, names: readonly string[]): Edit[] => {
  if (ts.isIdentifier(holder)) {
    return holderReads(scope, holder.text, names);
  }

  const elements = ts.isObjectBindingPattern(holder) ? holder.elements : undefined;
  const isAnswered = elements
    ?.every((element) => {
      const name = textOf(element.name);

      return isPlainElement(element) && names.includes(name);
    });

  if (isAnswered !== true) {
    throw refusal(holder, 'A pattern can only take, by their own names, what the option\'s statements answer');
  }

  return [];
};

// The kept statements as one block of text, moved to the indentation of the statement they replace.
const blockOf = (kept: readonly ts.Statement[], indent: string): string | undefined => {
  const first = kept.at(0);
  const last = kept.at(-1);

  if (first === undefined || last === undefined) {
    return undefined;
  }

  const source = first.getSourceFile().text;
  const start = first.getFullStart();
  const end = last.getEnd();
  const block = source
    .slice(start, end)
    .replace(LEADING_BLANK_LINES, '');
  const from = leadingIndent(block);
  const body = block.slice(from.length);

  return reindent(body, from, indent);
};

// `const y = f();`: the option's statements replace the statement, and `y.k` becomes `k`.
export const spliceStatements = (
  text: string,
  sources: Sources,
  local: ts.Identifier,
  call: ts.CallExpression,
): string => {
  const arrow = arrowOf(sources, local);
  const statement = holderOf(call);
  const declaration = call.parent;

  if (statement === undefined || !ts.isVariableDeclaration(declaration) || !ts.isBlock(arrow.body)) {
    return inlineCall(text, sources, local, call);
  }

  if (arrow.parameters.length > 0 || call.arguments.length > 0) {
    throw refusal(call, 'Statements spliced into the base take no parameters');
  }

  const final = arrow.body.statements.at(-1);
  const returned = final !== undefined && ts.isReturnStatement(final) ? final : undefined;
  const kept = returned === undefined ? arrow.body.statements : arrow.body.statements.slice(0, -1);

  if (kept.some(returnsEarly)) {
    throw refusal(arrow, 'Statements spliced into the base may only return at the end');
  }

  clashCheck(kept, statement);

  const names = answeredNames(returned);
  const reads = readsOf(statement.parent, declaration.name, names);
  const renamed = applied(text, reads);
  const indent = indentOf(text, statement);
  const block = blockOf(kept, indent);

  const span = spanOf(statement);

  return block === undefined ? withoutLines(renamed, span) : swapped(renamed, statement, block);
};
