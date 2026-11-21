import { zip } from 'es-toolkit';
import ts from 'typescript';

// A token of a text, without its trivia, so a step that only reindents moves it without changing it.
interface Leaf {
  start: number;
  text: string;
}

type Kept = [number, number];

type Round = ReadonlyMap<number, number>;

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

// Token starts followed through every rewrite of a text; a token a rewrite changed or dropped is no longer followed.
export class Follower {
  private positions = new Set<number>();

  public track(position: number): void {
    this.positions.add(position);
  }

  public has(position: number): boolean {
    return this.positions.has(position);
  }

  public readonly follow = (before: ts.SourceFile, after: ts.SourceFile): void => {
    const moves = movesOf(before, after);
    const positions = [...this.positions];
    const moved = positions
      .map((position) => {
        return moves.get(position);
      })
      .filter((to) => {
        return to !== undefined;
      });

    this.positions = new Set(moved);
  };
}
