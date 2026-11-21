import ts from 'typescript';

import {
  type Copy,
  type Edit,
  type Written,
  writtenWith,
} from './editUtils';
import { type Span, spanOf } from './sourceUtils';

// An edit and where what it writes starts in the text it makes.
interface Placed {
  edit: Edit;
  at: number;
}

const WRITTEN = /\S/u;

const pointAt = (position: number): Span => {
  const point: Span = {
    start: position,
    end: position,
  };

  return point;
};

// The runs of what one edit wrote that hold more than whitespace, each trimmed to it.
const writtenOf = (edit: Edit, at: number): Span[] => {
  const ordered = edit.copies
    .toSorted((left, right) => {
      return left.to - right.to;
    });
  const end: Copy = {
    from: 0,
    to: edit.insert.length,
    length: 0,
  };
  const gaps: Span[] = [];
  let from = 0;

  const stops = [...ordered, end];

  for (const copy of stops) {
    const gap = edit.insert.slice(from, copy.to);
    const first = gap.search(WRITTEN);

    if (first !== -1) {
      const last = gap.length - gap.trimEnd().length;
      const span: Span = {
        start: at + from + first,
        end: at + copy.to - last,
      };

      gaps.push(span);
    }

    from = Math.max(from, copy.to + copy.length);
  }

  return gaps;
};

// Where an edit took out more than whitespace: right after the copy before what it took, else where it starts.
const removedOf = (text: string, edit: Edit, at: number): Span[] => {
  const ordered = edit.copies
    .toSorted((left, right) => {
      return left.from - right.from;
    });
  const end: Copy = {
    from: edit.end,
    to: 0,
    length: 0,
  };
  const points: Span[] = [];
  let from = edit.start;
  let point = at;

  const stops = [...ordered, end];

  for (const copy of stops) {
    const taken = text.slice(from, copy.from);

    if (WRITTEN.test(taken)) {
      points.push(pointAt(point));
    }

    from = Math.max(from, copy.from + copy.length);
    point = at + copy.to + copy.length;
  }

  return points;
};

// Where a position lands: past every edit before it, and inside one, where a copy carries it or where the edit starts.
const pointIn = (placed: readonly Placed[], position: number): number => {
  let landed = position;

  for (const { edit, at } of placed) {
    const copy = edit.copies
      .find(({ from, length }) => {
        return from <= position && position <= from + length;
      });

    if (edit.end <= position) {
      landed = position - edit.end + at + edit.insert.length;
    }
    else if (edit.start < position) {
      landed = copy === undefined ? at : at + copy.to + position - copy.from;
    }
  }

  return landed;
};

// Each piece of a span that runs carry unchanged, where it lands.
const spansIn = (runs: readonly Copy[], span: Span): Span[] => {
  return runs
    .flatMap((run) => {
      const start = Math.max(span.start, run.from);
      const end = Math.min(span.end, run.from + run.length);
      const kept: Span[] = end > start
        ? [{
            start: run.to + start - run.from,
            end: run.to + end - run.from,
          }]
        : [];

      return kept;
    });
};

const isPoint = (mark: Span): boolean => {
  return mark.start === mark.end;
};

const isSame = (left: Span, right: Span): boolean => {
  return left.start === right.start && left.end === right.end;
};

/**
 * Tokens and what filling wrote, carried through every edit of a text exactly: a token keeps its identity while no
 * edit covers it or an edit carries it whole, and a span is touched when an edit wrote into it or took something out
 * of it. Whitespace alone, as a reindent writes, is not written.
 */
export class Follower {
  private tracked: Span[] = [];

  private marks: Span[] = [];

  // A token of the text as it now stands.
  public track(node: ts.Node): void {
    this.tracked.push(spanOf(node));
  }

  // Whether a node is, whole, a token that was tracked.
  public has(node: ts.Node): boolean {
    const span = spanOf(node);

    return this.tracked
      .some((tracked) => {
        return isSame(tracked, span);
      });
  }

  // Whether edits wrote into a node, or took something out from inside it.
  public isTouched(node: ts.Node): boolean {
    const { start, end } = spanOf(node);

    return this.marks
      .some((mark) => {
        return isPoint(mark) ? mark.start > start && mark.start < end : mark.start < end && mark.end > start;
      });
  }

  public readonly follow = (text: string, edits: readonly Edit[]): void => {
    const whole: Written = {
      insert: text,
      copies: [{
        from: 0,
        to: 0,
        length: text.length,
      }],
    };
    const runs = writtenWith(whole, edits).copies;
    const placed: Placed[] = [];
    let shift = 0;

    for (const edit of edits
      .toSorted((left, right) => {
        return left.start - right.start || left.end - right.end;
      })) {
      placed.push({
        edit,
        at: edit.start + shift,
      });

      shift += edit.insert.length - edit.end + edit.start;
    }

    const tracked = this.tracked
      .flatMap((span) => {
        return spansIn(runs, span)
          .filter((landed) => {
            return landed.end - landed.start === span.end - span.start;
          });
      });
    const moved = this.marks
      .filter(isPoint)
      .map((mark) => {
        const landed = pointIn(placed, mark.start);

        return pointAt(landed);
      });
    const carried = this.marks
      .filter((mark) => {
        return !isPoint(mark);
      })
      .flatMap((mark) => {
        return spansIn(runs, mark);
      });
    const added = placed
      .flatMap(({ edit, at }) => {
        const written = writtenOf(edit, at);
        const removed = removedOf(text, edit, at);

        return written.concat(removed);
      });

    this.tracked = tracked;

    this.marks = [
      ...moved,
      ...carried,
      ...added,
    ];
  };
}
