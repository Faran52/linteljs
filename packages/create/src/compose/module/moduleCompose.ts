import ts from 'typescript';

import { DEFAULT_IMPORT_GROUPS } from '../constants';
import {
  exportOf,
  type Sources,
  sourcesOf,
} from '../utils/bindingUtils';
import { importBlock, type ImportGroups } from '../utils/importUtils';
import { filledOnce } from '../utils/inlineUtils';
import { simplifiedOnce } from '../utils/simplifyUtils';
import {
  collect,
  indentAt,
  indentOf,
  isPlainElement,
  isReference,
  patternOf,
  referencesIn,
  type Span,
  splice,
  swapped,
  textOf,
  valueOf,
} from '../utils/sourceUtils';
import {
  checked,
  settled,
  type Step,
  wellFormed,
} from '../utils/stepUtils';

export interface ComposeRequest {
  // The base module's source: ordinary typed code that imports its parameter modules.
  base: string;
  // A parameter module's specifier, as the base imports it, to the chosen option module's source.
  options: Readonly<Record<string, string>>;
  // The project's import groups, as its lint config hands them to `simple-import-sort`.
  importGroups?: ImportGroups;
}

interface Destructured {
  arrow: ts.ArrowFunction;
  parameter: ts.ParameterDeclaration;
  pattern: ts.ObjectBindingPattern;
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

  return value.text;
};

// A comment is not a value: a directive line takes an option's string export, or goes when the option has none.
const withComments = (text: string, sources: Sources): string => {
  return text
    .replaceAll(DIRECTIVE, (line, specifier: string, exported: string) => {
      const note = noteOf(sources, specifier, exported);
      const at = line.indexOf('//');
      const indent = indentAt(line, at);

      return note === undefined ? '' : `${indent}// ${note}\n`;
    });
};

// The arrow parameters that destructure plain names, the one shape a name can be dropped from as it stands.
const destructuredIn = (file: ts.SourceFile): Destructured[] => {
  return collect(file, ts.isArrowFunction)
    .flatMap((arrow) => {
      return arrow.parameters
        .flatMap((parameter) => {
          const pattern = parameter.name;
          const isPlain = ts.isObjectBindingPattern(pattern) && pattern.elements.every(isPlainElement);
          const found: Destructured[] = isPlain
            ? [{
                arrow,
                parameter,
                pattern,
              }]
            : [];

          return found;
        });
    });
};

// A pattern with no name left: the parameter goes when none follows it, else it stays as `{}`.
const emptied = (text: string, {
  arrow,
  parameter,
  pattern,
}: Destructured): string => {
  const index = arrow.parameters.indexOf(parameter);
  const previous = arrow.parameters[index - 1];
  const gone: Span = {
    start: previous === undefined ? parameter.getStart() : previous.getEnd(),
    end: parameter.getEnd(),
  };

  return index === arrow.parameters.length - 1 ? splice(text, gone, '') : swapped(text, pattern, '{}');
};

// A destructured parameter nothing reads is dropped from its pattern.
const prunedOnce: Step = (text, file) => {
  for (const site of destructuredIn(file)) {
    const { arrow, pattern } = site;
    const names = pattern.elements
      .map((element) => {
        return textOf(element.name);
      });
    const read = names
      .filter((name) => {
        return referencesIn(arrow, name).length > 0;
      });

    if (read.length === 0 && names.length > 0) {
      return emptied(text, site);
    }

    if (read.length < names.length) {
      const indent = indentOf(text, pattern);
      const printed = patternOf(read, indent);

      return swapped(text, pattern, printed);
    }
  }

  return undefined;
};

// The base with every parameter filled from its option module, simplified until none of the machinery is left.
export const moduleCompose = (request: ComposeRequest): string => {
  const sources = sourcesOf(request.base, request.options);
  const commented = withComments(sources.body, sources);
  const filled = settled(commented, (text, file) => {
    return filledOnce(text, file, sources);
  });
  const simplified = settled(filled, simplifiedOnce);
  const pruned = settled(simplified, prunedOnce);
  const file = checked(pruned, sources);
  const identifiers = collect(file, ts.isIdentifier)
    .filter(isReference)
    .map((identifier) => {
      return identifier.text;
    });
  const read = new Set(identifiers);
  const imports = importBlock(sources.imports, read, request.importGroups ?? DEFAULT_IMPORT_GROUPS);
  const body = imports === '' ? pruned : `${imports}\n\n${pruned}`;

  return wellFormed(sources.header + body);
};
