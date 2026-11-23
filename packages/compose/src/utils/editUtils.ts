import ts from 'typescript';

import { MAX_INLINE } from '../constants';

import {
  fittingOf,
  indentOf,
  movedLines,
  type Span,
  textOf,
} from './sourceUtils';

// A run of the text a step edits, carried unchanged: `length` characters from `from` there, at `to` in what holds it.
export interface Copy {
  from: number;
  to: number;
  length: number;
}

// Text to write, with the runs of the edited text it carries unchanged; the rest of it is written.
export interface Written {
  insert: string;
  copies: readonly Copy[];
}

export type Edit = Span & Written;

// A line as `reindented` writes it, with the run of the old line it carries.
interface PlacedLine {
  line: string;
  move: Copy;
}

const SHOWN = 80;

export const plain = (insert: string): Written => {
  const written: Written = {
    insert,
    copies: [],
  };

  return written;
};

// A span of the edited text, carried as it is.
export const copied = (text: string, span: Span): Written => {
  const copy: Copy = {
    from: span.start,
    to: 0,
    length: span.end - span.start,
  };
  const written: Written = {
    insert: text.slice(span.start, span.end),
    copies: [copy],
  };

  return written;
};

// A node of the edited text, carried as it is.
export const copyOf = (node: ts.Node): Written => {
  const { text } = node.getSourceFile();
  const span: Span = {
    start: node.getStart(),
    end: node.getEnd(),
  };

  return copied(text, span);
};

export const editOf = (span: Span, written: Written): Edit => {
  const edit: Edit = {
    start: span.start,
    end: span.end,
    ...written,
  };

  return edit;
};

// A node of the edited text replaced by what is written.
export const editOver = (node: ts.Node, written: Written): Edit => {
  const span: Span = {
    start: node.getStart(),
    end: node.getEnd(),
  };

  return editOf(span, written);
};

// A span of the edited text taken out.
export const takenOut = (span: Span): Edit => {
  const nothing = plain('');

  return editOf(span, nothing);
};

// Each copy carried through moves that take runs of one written text unchanged into another.
const carried = (copies: readonly Copy[], moves: readonly Copy[]): Copy[] => {
  return copies
    .flatMap((copy) => {
      return moves
        .flatMap((move) => {
          const start = Math.max(copy.to, move.from);
          const end = Math.min(copy.to + copy.length, move.from + move.length);
          const kept: Copy[] = end > start
            ? [{
                from: copy.from + start - copy.to,
                to: move.to + start - move.from,
                length: end - start,
              }]
            : [];

          return kept;
        });
    });
};

export const joined = (parts: readonly Written[]): Written => {
  let insert = '';
  const copies: Copy[] = [];

  for (const part of parts) {
    const move: Copy = {
      from: 0,
      to: insert.length,
      length: part.insert.length,
    };

    copies.push(...carried(part.copies, [move]));
    insert += part.insert;
  }

  const written: Written = {
    insert,
    copies,
  };

  return written;
};

// A span of a written text, with the copies inside it.
export const sliced = (written: Written, span: Span): Written => {
  const move: Copy = {
    from: span.start,
    to: 0,
    length: span.end - span.start,
  };
  const part: Written = {
    insert: written.insert.slice(span.start, span.end),
    copies: carried(written.copies, [move]),
  };

  return part;
};

// Every edit of a written text applied against it as it was; two that overlap are refused. An edit's copies are of
// the same text the written one copies from.
export const writtenWith = (written: Written, edits: readonly Edit[]): Written => {
  const ordered = edits
    .toSorted((left, right) => {
      return left.start - right.start || left.end - right.end;
    });
  const parts: Written[] = [];
  let at = 0;

  for (const edit of ordered) {
    if (edit.start < at) {
      throw new Error('Two edits of one text overlap, so neither can be written as it was meant');
    }

    const kept: Span = {
      start: at,
      end: edit.start,
    };

    parts.push(sliced(written, kept), edit);
    at = edit.end;
  }

  const rest: Span = {
    start: at,
    end: written.insert.length,
  };

  return joined([...parts, sliced(written, rest)]);
};

export const applied = (text: string, edits: readonly Edit[]): string => {
  const whole = plain(text);
  const isOutside = edits
    .some(({ start, end }) => {
      return !(start >= 0 && end >= start && end <= text.length);
    });

  if (isOutside) {
    throw new Error('An edit lies outside the text it edits, so it cannot be written');
  }

  return writtenWith(whole, edits).insert;
};

// `reindent` over a written text, each line's copies carried past the indentation it changes.
export const reindented = (written: Written, from: string, to: string): Written => {
  const moved = movedLines(written.insert, from);
  let oldAt = 0;
  let newAt = 0;
  const placed = written.insert
    .split('\n')
    .map((line, index) => {
      const isMoved = moved.has(index);
      const lead = isMoved ? from.length : 0;
      const indent = isMoved ? to : '';
      const next = indent + line.slice(lead);
      const move: Copy = {
        from: oldAt + lead,
        to: newAt + indent.length,
        length: line.length - lead,
      };
      const each: PlacedLine = {
        line: next,
        move,
      };

      oldAt += line.length + 1;
      newAt += next.length + 1;

      return each;
    });
  const lines = placed
    .map((each) => {
      return each.line;
    });
  const moves = placed
    .map((each) => {
      return each.move;
    });
  const result: Written = {
    insert: lines.join('\n'),
    copies: carried(written.copies, moves),
  };

  return result;
};

// An expression as it can stand in place of `replaced`, from its text as written.
export const fitted = (replaced: ts.Node, expression: ts.Expression, own: Written): Written => {
  const { before, after } = fittingOf(replaced, expression);

  return joined([
    plain(before),
    own,
    plain(after),
  ]);
};

// Written texts one after another, `gap` between each two.
export const separated = (parts: readonly Written[], gap: string): Written => {
  const between = plain(gap);
  const spaced = parts
    .flatMap((part, index) => {
      const each = index === 0 ? [part] : [between, part];

      return each;
    });

  return joined(spaced);
};

const rowOf = (items: readonly Written[], open: string, close: string): Written => {
  const row = separated(items, ', ');

  return joined([
    plain(open),
    row,
    plain(close),
  ]);
};

const columnOf = (items: readonly Written[], indent: string, open: string, close: string): Written => {
  const lines = items
    .flatMap((item) => {
      const line = [
        plain(`\n${indent}  `),
        item,
        plain(','),
      ];

      return line;
    });

  return joined([
    plain(open),
    ...lines,
    plain(`\n${indent}${close}`),
  ]);
};

// Up to two names on one line, more than two broken, one per line.
export const patternOf = (names: readonly Written[], indent: string): Written => {
  if (names.length === 0) {
    return plain('{}');
  }

  return names.length <= MAX_INLINE ? rowOf(names, '{ ', ' }') : columnOf(names, indent, '{', '}');
};

// Nodes of the edited text as an array's elements, up to two on one line, more than two broken, one per line.
export const arrayOf = (elements: readonly ts.Expression[], indent: string): Written => {
  const isRow = elements.length <= MAX_INLINE;
  const to = isRow ? indent : `${indent}  `;
  const items = elements
    .map((element) => {
      const { text } = element.getSourceFile();
      const from = indentOf(text, element);
      const own = copyOf(element);

      return reindented(own, from, to);
    });

  return isRow ? rowOf(items, '[', ']') : columnOf(items, indent, '[', ']');
};

// A refusal that shows the code it is about.
export const refusal = (node: ts.Node, reason: string): Error => {
  const shown = textOf(node).slice(0, SHOWN);

  return new Error(`${reason}: ${shown}`);
};
