import { mapValues } from 'es-toolkit';
import ts from 'typescript';

import {
  BYTE_ORDER_MARK,
  COMMENT_ENDS,
  DEFAULT_IMPORT_GROUPS,
  OTHER_LINE_ENDS,
} from '../constants';
import {
  entryOf,
  exportOf,
  localsOf,
  type Sources,
  sourcesOf,
} from '../utils/bindingUtils';
import { Follower } from '../utils/followUtils';
import { importBlock, type ImportGroups } from '../utils/importUtils';
import { filledOnce } from '../utils/inlineUtils';
import { prunedOnce, trackRead } from '../utils/pruneUtils';
import { declarationOf, scopeOf } from '../utils/scopeUtils';
import { simplifiedOnce } from '../utils/simplifyUtils';
import {
  collect,
  indentAt,
  isReference,
  parse,
  valueOf,
} from '../utils/sourceUtils';
import {
  checked,
  settled,
  wellFormed,
} from '../utils/stepUtils';

export interface ComposeRequest {
  // The base module's source: ordinary typed code that imports its parameter modules.
  base: string;
  // A parameter module's specifier, as the base imports it, to the chosen option module's source. Every option module
  // sits in the base's own directory, so its specifier is `./<name>` and names the same file from every module.
  options: Readonly<Record<string, string>>;
  // A module an option or the base imports by a relative specifier, as imported, to its source: read only to prove
  // that a member read of it runs no code, never inlined or printed.
  modules: Readonly<Record<string, string>>;
  /**
   * The specifiers whose exports are plain data, so a member read through their import, at any depth, runs no code;
   * with `pureCalls` too, so does a read of what their calls answer.
   * Each is matched whole, a `*` standing for any run of characters but `/`: `./*.styles`, `@styles/tokens.stylex`.
   */
  plainData: readonly string[];
  // The specifiers whose functions run no code beyond answering, so a call through their import, its arguments
  // proven on their own, may be moved past. A separate trust from `plainData`, matched the same way.
  pureCalls: readonly string[];
  // The project's import groups, as its lint config hands them to `simple-import-sort`.
  importGroups?: ImportGroups;
}

interface Before {
  // The base's bindings something reads before filling, the only ones pruning may drop.
  follower: Follower;
  // The names the base imports and never reads, which stay imported whatever the fills leave.
  unread: string[];
}

const DIRECTIVE = /^[\t ]*\/\/ @lintel:comment (?<specifier>\S+)#(?<exported>\w+)\n/gmu;

// The string an option exports under a name, undefined when it exports nothing there.
const noteOf = (sources: Sources, specifier: string, exported: string): string | undefined => {
  const module = sources.modules.get(specifier);

  if (module === undefined) {
    throw new Error(`${specifier} is not a parameter module, so it has no ${exported} to write as a comment.`);
  }

  const found = exportOf(module, exported);

  if (found === undefined) {
    return undefined;
  }

  const initializer = ts.isVariableDeclaration(found) ? found.initializer : undefined;
  const value = initializer === undefined ? undefined : valueOf(initializer);

  if (value === undefined || !ts.isStringLiteral(value)) {
    throw new Error(`${specifier}#${exported} must be a string to become a comment.`);
  }

  if (COMMENT_ENDS.test(value.text)) {
    throw new Error(`${specifier}#${exported} holds a line break, which would end the comment and write code.`);
  }

  return value.text;
};

// Where each comment of a text starts, so a directive is read only from a comment, never from a string or a template.
const commentStartsOf = (text: string): Set<number> => {
  const file = parse(text);
  const starts = new Set<number>();

  const visit = (node: ts.Node): void => {
    const children = node.getChildren(file);

    if (children.length === 0 && !ts.isJsxText(node)) {
      ts.getLeadingCommentRanges(text, node.pos)
        ?.forEach((range) => {
          starts.add(range.pos);
        });
    }

    children.forEach(visit);
  };

  visit(file);

  return starts;
};

// A comment is not a value: a directive line takes an option's string export, or goes when the option has none.
const withComments = (text: string, sources: Sources): string => {
  const starts = commentStartsOf(text);

  return text
    .replaceAll(DIRECTIVE, (line, specifier: string, exported: string, offset: number) => {
      const at = line.indexOf('//');

      if (!starts.has(offset + at)) {
        return line;
      }

      const note = noteOf(sources, specifier, exported);
      const indent = indentAt(line, at);

      return note === undefined ? '' : `${indent}// ${note}\n`;
    });
};

const beforeOf = (base: string, file: ts.SourceFile, sources: Sources): Before => {
  const checker = scopeOf(file, sources.modules, sources.held);
  const follower = new Follower();

  trackRead(file, checker, follower);

  const reads = collect(file, ts.isIdentifier)
    .filter((identifier) => {
      return isReference(identifier) && declarationOf(checker, identifier) === undefined;
    })
    .map((identifier) => {
      return identifier.text;
    });
  const read = new Set(reads);
  const unread = parse(base).statements
    .filter(ts.isImportDeclaration)
    .map(entryOf)
    .flatMap(localsOf)
    .filter((local) => {
      return !read.has(local) && !sources.bindings.has(local);
    });
  const before: Before = {
    follower,
    unread,
  };

  return before;
};

// A source as the engine reads it: every line ended by LF, no byte order mark.
const plainOf = (source: string): string => {
  const unmarked = source.startsWith(BYTE_ORDER_MARK) ? source.slice(BYTE_ORDER_MARK.length) : source;

  return unmarked.replaceAll(OTHER_LINE_ENDS, '\n');
};

// The base with every parameter filled from its option module, simplified until none of the machinery is left.
export const moduleCompose = (request: ComposeRequest): string => {
  const base = plainOf(request.base);
  const options = mapValues(request.options, plainOf);
  const modules = mapValues(request.modules, plainOf);
  const mark = request.base.startsWith(BYTE_ORDER_MARK) ? BYTE_ORDER_MARK : '';
  const sources = sourcesOf(base, options, modules, request);
  const commented = withComments(sources.body, sources);
  const start = parse(commented);
  const { follower, unread } = beforeOf(base, start, sources);
  const filled = settled(start, (text, file) => {
    return filledOnce(text, file, sources);
  }, follower.follow);
  const simplified = settled(filled, (text, file) => {
    return simplifiedOnce(text, file, (node) => {
      return follower.isTouched(node);
    });
  }, follower.follow);
  const pruned = settled(simplified, prunedOnce(follower, sources), follower.follow);
  const file = checked(pruned, sources);
  const identifiers = collect(file, ts.isIdentifier)
    .filter(isReference)
    .map((identifier) => {
      return identifier.text;
    });
  const read = new Set([...identifiers, ...unread]);
  const imports = importBlock(sources.imports, read, request.importGroups ?? DEFAULT_IMPORT_GROUPS);
  const body = imports === '' ? file.text : `${imports}\n\n${file.text}`;

  return wellFormed(mark + sources.header + body);
};
