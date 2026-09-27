// A string, not a fix, so `importNewlines.ts` can measure it first.
import {
  type NodeLocation,
  rebuildLosesComments,
  type RuleNode,
  type SourceCode,
} from '../../../utils/ruleUtils.ts';

import type { Indents } from '../../../utils/layoutUtils.ts';

interface ImportDeclarationNode {
  type: 'ImportDeclaration';
}

interface ImportSource {
  range: [number, number];
  loc: NodeLocation;
}

// `range`/`loc` are always present on a parsed statement; `importKind` is TypeScript-only.
interface ImportShape {
  source: ImportSource;
  range: [number, number];
  importKind?: string;
  loc: NodeLocation;
}

export type ImportNode = Extract<RuleNode, ImportDeclarationNode> & ImportShape;

interface ClauseParts {
  defaultImport: string;
  namespaceImport: string;
  namedImports: string[];
}

// `imported.name` drops an inline `type` prefix and is undefined for a string-literal name.
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

// Emitting at column 0 fights an indent rule.
const writeNamedClause = (named: string[], indents: Indents | null, eol: string): string => {
  if (!indents) {
    return `{ ${named.join(', ')} }`;
  }

  const { outer, inner } = indents;
  const separator = `,${eol}${inner}`;

  return `{${eol}${inner}${named.join(separator)}${eol}${outer}}`;
};

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

  // Verbatim, so import attributes survive the rebuild.
  parts.push(' from ', sourceCode.text.slice(node.source.range[0], node.range[1]));

  return parts.join('');
};
