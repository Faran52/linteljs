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

// Every edit applied to one text, last first, so no edit moves another's span.
export const applied = (text: string, edits: readonly Edit[]): string => {
  const ordered = edits
    .toSorted((left, right) => {
      return right.start - left.start;
    });

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
