// Emitter: import statement in, replacement text out. A string, not a fix, so `index.ts` can measure it first.
import {
  rebuildLosesComments,
  type RuleNode,
  type SourceCode,
} from '../../utils/ruleUtils.ts';

import type { Indents } from '../../utils/layoutUtils.ts';

// `range`/`loc` are ESTree-optional but always present on a parsed statement; `importKind` is TypeScript-only, unnamed
// in ESLint's ESTree types.
export type ImportNode = Extract<RuleNode, { type: 'ImportDeclaration' }> & {
  source: { range: [number, number];
    loc: { end: { line: number } }; };
  range: [number, number];
  importKind?: string;
  loc: {
    start: { line: number;
      column: number; };
    end: { line: number };
  };
};

interface ClauseParts {
  defaultImport: string;
  namespaceImport: string;
  namedImports: string[];
}

// Each specifier's own source text, not a reconstruction: `imported.name` drops an inline `type` prefix and is
// undefined for a string-literal name.
const partsOf = (sourceCode: SourceCode, node: ImportNode): ClauseParts => {
  const parts: ClauseParts = {
    defaultImport: '',
    namespaceImport: '',
    namedImports: [],
  };

  for (const specifier of node.specifiers) {
    const text = sourceCode.getText(specifier);

    if (specifier.type === 'ImportDefaultSpecifier') {
      parts.defaultImport = text;
    }
    else if (specifier.type === 'ImportNamespaceSpecifier') {
      parts.namespaceImport = text;
    }
    else {
      parts.namedImports.push(text);
    }
  }

  return parts;
};

// Split form lands at the statement's own column, one step in; emitting at column 0 fights an indent rule.
const writeNamedClause = (named: string[], indents: Indents | null, eol: string): string => {
  if (!indents) {
    return `{ ${named.join(', ')} }`;
  }

  const { outer, inner } = indents;
  const separator = `,${eol}${inner}`;

  return `{${eol}${inner}${named.join(separator)}${eol}${outer}}`;
};

// The statement rewritten, or null when it must be left alone. `indents` picks split columns, or null for collapsed.
export const writeImport = (
  sourceCode: SourceCode,
  node: ImportNode,
  indents: Indents | null,
  eol: string,
): string | null => {
  if (rebuildLosesComments(sourceCode, node)) {
    return null;
  }

  const {
    defaultImport,
    namespaceImport,
    namedImports,
  } = partsOf(sourceCode, node);
  const parts: string[] = [node.importKind === 'type' ? 'import type' : 'import', ' '];
  const leading = [defaultImport, namespaceImport].filter(Boolean);

  if (leading.length > 0) {
    parts.push(leading.join(', '));

    if (namedImports.length > 0) {
      parts.push(', ');
    }
  }

  if (namedImports.length > 0) {
    parts.push(writeNamedClause(namedImports, indents, eol));
  }

  // Everything from the module specifier onward, verbatim, so import attributes survive the rebuild.
  parts.push(' from ', sourceCode.text.slice(node.source.range[0], node.range[1]));

  return parts.join('');
};
