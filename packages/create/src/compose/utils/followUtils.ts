import { zip } from 'es-toolkit';
import ts from 'typescript';

// A token of a text, without its trivia, so a step that only reindents moves it without changing it.
interface Leaf {
  start: number;
  text: string;
}

type Kept = [number, number];

type Round = ReadonlyMap<number, number>;

// A token of the first text: where it stood and its place among that text's tokens.
interface Origin {
  start: number;
  index: number;
}

// Where rewrites wrote or dropped something, from one token start to another.
interface Mark {
  from: number;
  to: number;
}

// Each text is the next of one rewrite and the last of another, so its tokens are read once.
const LEAVES = new WeakMap<ts.SourceFile, Leaf[]>();

const leavesOf = (file: ts.SourceFile): Leaf[] => {
  const known = LEAVES.get(file);

  if (known !== undefined) {
    return known;
  }

  const leaves: Leaf[] = [];

  const visit = (node: ts.Node): void => {
    const count = leaves.length;

    node.forEachChild(visit);

    const start = node.getStart(file);
    const text = file.text.slice(start, node.getEnd());

    if (leaves.length === count && text.trim() !== '') {
      leaves.push({
        start,
        text,
      });
    }
  };

  visit(file);
  LEAVES.set(file, leaves);

  return leaves;
};

// The furthest token of the first list each diagonal reaches; before the first edit the path stands at 0.
const endOf = (round: Round, diagonal: number): number => {
  return round.get(diagonal) ?? 0;
};

// The diagonal a path on this one came from, by the move Myers takes there.
const previousOf = (round: Round, diagonal: number, edits: number): number => {
  const isEdge = diagonal === -edits;
  const isDown = isEdge || (diagonal !== edits && endOf(round, diagonal - 1) < endOf(round, diagonal + 1));

  return isDown ? diagonal + 1 : diagonal - 1;
};

// Each round of Myers' search over two token lists, as the ends it starts from, up to the round that reaches both ends.
const traceOf = (before: readonly string[], after: readonly string[]): Round[] => {
  const trace: Round[] = [];
  let round: Round = new Map<number, number>();
  let edits = 0;
  let isDone = false;

  while (!isDone) {
    const next = new Map(round);

    trace.push(round);

    for (let diagonal = -edits; diagonal <= edits && !isDone; diagonal += 2) {
      const previous = previousOf(round, diagonal, edits);
      let x = endOf(round, previous) + (previous < diagonal ? 1 : 0);
      let y = x - diagonal;

      while (x < before.length && y < after.length && before[x] === after[y]) {
        x += 1;
        y += 1;
      }

      next.set(diagonal, x);
      isDone = x >= before.length && y >= after.length;
    }

    round = next;
    edits += 1;
  }

  return trace;
};

// The pairs of indices a shortest edit script between two token lists keeps, walked back from both ends.
const keptOf = (before: readonly string[], after: readonly string[]): Kept[] => {
  const rounds = traceOf(before, after)
    .entries()
    .toArray();
  const kept: Kept[] = [];
  let x = before.length;
  let y = after.length;

  for (const [edits, ends] of rounds.toReversed()) {
    const previous = previousOf(ends, x - y, edits);
    const fromX = endOf(ends, previous);
    const fromY = fromX - previous;

    while (x > fromX && y > fromY) {
      x -= 1;
      y -= 1;
      kept.push([x, y]);
    }

    x = fromX;
    y = fromY;
  }

  return kept;
};

const textsOf = (leaves: readonly Leaf[]): string[] => {
  return leaves
    .map(({ text }) => {
      return text;
    });
};

// Where each token of one text stands in the next, for the tokens a rewrite left as they were.
const movesOf = (before: ts.SourceFile, after: ts.SourceFile): Map<number, number> => {
  const from = leavesOf(before);
  const to = leavesOf(after);
  const kept = keptOf(textsOf(from), textsOf(to));
  const keptFrom = new Set(kept
    .map(([left]) => {
      return left;
    }));
  const keptTo = new Set(kept
    .map(([, right]) => {
      return right;
    }));

  const stayed = (leaves: readonly Leaf[], indices: ReadonlySet<number>): number[] => {
    return leaves
      .filter((_leaf, index) => {
        return indices.has(index);
      })
      .map(({ start }) => {
        return start;
      });
  };

  const fromStarts = stayed(from, keptFrom);
  const toStarts = stayed(to, keptTo);
  const pairs = zip(fromStarts, toStarts);

  return new Map(pairs);
};

// Each token of a text followed through every rewrite of it, back to the token of the first text it was, if any: a
// token a rewrite wrote has none.
export class Follower {
  private origins: Map<number, Origin | undefined>;

  private readonly tracked = new Set<number>();

  private readonly marks = new WeakMap<ts.SourceFile, Mark[]>();

  public constructor(first: ts.SourceFile) {
    const origins = leavesOf(first)
      .map(({ start }, index) => {
        const origin: Origin = {
          start,
          index,
        };
        const pair: [number, Origin] = [start, origin];

        return pair;
      });

    this.origins = new Map(origins);
  }

  // A token of the first text, by where it starts there.
  public track(start: number): void {
    this.tracked.add(start);
  }

  // Whether the token now at a position is one tracked in the first text.
  public has(position: number): boolean {
    const origin = this.origins.get(position);

    return origin !== undefined && this.tracked.has(origin.start);
  }

  // Whether rewrites wrote a token of a node, or dropped one from between its tokens.
  public isTouched(file: ts.SourceFile, node: ts.Node): boolean {
    const start = node.getStart(file);
    const end = node.getEnd();

    return this
      .marksOf(file)
      .some(({ from, to }) => {
        return from >= start && to < end;
      });
  }

  public readonly follow = (before: ts.SourceFile, after: ts.SourceFile): void => {
    const moves = movesOf(before, after);
    const origins = [...moves]
      .map(([from, to]) => {
        const pair: [number, Origin | undefined] = [to, this.origins.get(from)];

        return pair;
      });

    this.origins = new Map(origins);
  };

  // A written token, as itself, and a dropped one, as the two tokens either side of it.
  private marksOf(file: ts.SourceFile): Mark[] {
    const known = this.marks.get(file);

    if (known !== undefined) {
      return known;
    }

    const leaves = leavesOf(file);
    const written = leaves
      .filter(({ start }) => {
        return this.origins.get(start) === undefined;
      })
      .map(({ start }) => {
        const mark: Mark = {
          from: start,
          to: start,
        };

        return mark;
      });
    const lefts = leaves.slice(0, -1);
    const rights = leaves.slice(1);
    const dropped = zip(lefts, rights)
      .filter(([left, right]) => {
        const leftIndex = this.origins.get(left.start)?.index;
        const rightIndex = this.origins.get(right.start)?.index;

        return leftIndex !== undefined && rightIndex !== undefined && rightIndex - leftIndex > 1;
      })
      .map(([left, right]) => {
        const mark: Mark = {
          from: left.start,
          to: right.start,
        };

        return mark;
      });
    const marks = [...written, ...dropped];

    this.marks.set(file, marks);

    return marks;
  }
}
