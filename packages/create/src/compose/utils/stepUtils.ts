import ts from 'typescript';

import { localsOf, type Sources } from './bindingUtils';
import {
  boundIn,
  collect,
  declaredIn,
  isReference,
  parse,
} from './sourceUtils';

export type Step = (text: string, file: ts.SourceFile) => string | undefined;

const MARKER = '@lintel:';
const STEP_LIMIT = 10_000;

// Until a rewrite answers undefined; a module that never settles is refused rather than looped on.
export const settled = (text: string, once: Step): string => {
  let current = text;

  for (let steps = 0; steps < STEP_LIMIT; steps += 1) {
    const file = parse(current);
    const next = once(current, file);

    if (next === undefined) {
      return current;
    }

    current = next;
  }

  throw new Error('The composition did not settle; an option module refers back to itself.');
};

// Nothing of the parameters may be left, and every name the composed body reads must mean what its author meant.
export const checked = (text: string, sources: Sources): ts.SourceFile => {
  const file = parse(text);
  const reads = collect(file, ts.isIdentifier).filter(isReference);
  const left = reads
    .find((identifier) => {
      return sources.bindings.has(identifier.text);
    });
  const what = left === undefined ? MARKER : left.text;

  if (left !== undefined || text.includes(MARKER)) {
    throw new Error(`Something of the parameters is left after composing: ${what}`);
  }

  const bound = boundIn(file);
  const declared = declaredIn(file);
  const imported = new Set(sources.imports.flatMap(localsOf));
  const known = bound
    .union(declared)
    .union(imported);
  const owned = [...sources.modules.values()]
    .map(declaredIn)
    .reduce((all, names) => {
      return all.union(names);
    }, new Set<string>());
  const orphan = reads
    .find((identifier) => {
      return owned.has(identifier.text) && !known.has(identifier.text);
    });

  if (orphan !== undefined) {
    throw new Error(`"${orphan.text}" is declared in an option module and read by code that left it behind.`);
  }

  const captured = reads
    .find((identifier) => {
      return bound.has(identifier.text) && imported.has(identifier.text);
    });

  if (captured !== undefined) {
    throw new Error(`"${captured.text}" is imported and also bound in the composed body; one of the two is captured.`);
  }

  return file;
};

// What is written must still be a module.
export const wellFormed = (text: string): string => {
  const { diagnostics = [] } = ts.transpileModule(text, {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve },
    fileName: 'module.tsx',
  });
  const [fault] = diagnostics;

  if (fault !== undefined) {
    const reason = ts.flattenDiagnosticMessageText(fault.messageText, ' ');

    throw new Error(`The composed module does not parse: ${reason}`);
  }

  return text;
};
