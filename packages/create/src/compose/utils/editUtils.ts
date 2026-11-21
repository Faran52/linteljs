import ts from 'typescript';

import {
  type Span,
  splice,
  textOf,
} from './sourceUtils';

export interface Edit extends Span {
  insert: string;
}

const SHOWN = 80;

// Every edit applied to one text, last first, so no edit moves another's span; two that overlap are refused.
export const applied = (text: string, edits: readonly Edit[]): string => {
  const ordered = edits
    .toSorted((left, right) => {
      return right.start - left.start;
    });
  const isOverlapping = ordered
    .some((edit, index) => {
      const earlier = ordered[index + 1];

      return earlier !== undefined && earlier.end > edit.start;
    });

  if (isOverlapping) {
    throw new Error('Two edits of one text overlap, so neither can be written as it was meant');
  }

  return ordered
    .reduce((current, edit) => {
      return splice(current, edit, edit.insert);
    }, text);
};

// A refusal that shows the code it is about.
export const refusal = (node: ts.Node, reason: string): Error => {
  const shown = textOf(node).slice(0, SHOWN);

  return new Error(`${reason}: ${shown}`);
};
