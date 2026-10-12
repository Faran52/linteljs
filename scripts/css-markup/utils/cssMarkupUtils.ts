import { basename } from 'node:path';

import ts from 'typescript';

import type { Table } from '../../utils/codegenUtils.ts';

export interface MarkupFile {
  readonly map: Table;
  // The shared markup, from the shell root: `styling/atomic/src/...` or `<drawer>/styling/atomic/src/...`.
  readonly markup: string;
}

export interface Target {
  readonly root: string;
  readonly attribute: string;
  readonly files: readonly MarkupFile[];
}

interface Edit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

// A class value: the literal when it is known, else the expression choosing it.
interface ClassValue {
  readonly literal?: string;
  readonly expression: string;
}

interface Lookup {
  readonly node: ts.Expression;
  readonly value: ClassValue;
}

const MAP_NAME = 'classNames';

// The css styling's copy sits beside the markup's `styling/atomic/`, in `styling/css/`.
export const cssPathOf = (markup: string): string => {
  return markup.replace('styling/atomic/', 'styling/css/');
};

const quoted = (value: string): string => {
  return `'${value}'`;
};

const classValueOf = (map: Table, access: ts.PropertyAccessExpression): Lookup => {
  const entry = map[access.name.text];

  if (entry === undefined) {
    throw new Error(`no class for ${access.getText()}`);
  }

  if (typeof entry === 'string') {
    const lookup = { node: access, value: { literal: entry, expression: quoted(entry) } };

    return lookup;
  }

  const call = access.parent;
  const argument = ts.isCallExpression(call) ? call.arguments[0] : undefined;

  if (!ts.isCallExpression(call) || argument === undefined) {
    throw new Error(`${access.getText()} is a toggle, called with its condition`);
  }

  if (argument.kind === ts.SyntaxKind.TrueKeyword || argument.kind === ts.SyntaxKind.FalseKeyword) {
    const literal = argument.kind === ts.SyntaxKind.TrueKeyword ? entry.on : entry.off;

    const lookup = { node: call, value: { literal, expression: quoted(literal) } };

    return lookup;
  }

  const expression = `${argument.getText()} ? ${quoted(entry.on)} : ${quoted(entry.off)}`;

  const lookup = { node: call, value: { expression } };

  return lookup;
};

const attributeText = (attribute: string, value: ClassValue): string => {
  return value.literal === undefined ? `${attribute}={${value.expression}}` : `${attribute}="${value.literal}"`;
};

const enclosingAttribute = (node: ts.Node): ts.JsxAttribute => {
  if (ts.isJsxAttribute(node)) {
    return node;
  }

  if (ts.isSourceFile(node)) {
    throw new Error('a styles attribute other than the class sits outside a JSX attribute');
  }

  return enclosingAttribute(node.parent);
};

// Where a looked-up entry lands: an element's props, an object's, or one attribute read off it.
const editOf = (map: Table, attribute: string, access: ts.PropertyAccessExpression): Edit => {
  const { node, value } = classValueOf(map, access);
  const { parent } = node;

  if (ts.isJsxSpreadAttribute(parent) || ts.isSpreadAssignment(parent)) {
    const text = ts.isJsxSpreadAttribute(parent)
      ? attributeText(attribute, value)
      : `${attribute}: ${value.expression}`;
    const edit = {
      start: parent.getStart(),
      end: parent.getEnd(),
      text,
    };

    return edit;
  }

  if (ts.isPropertyAccessExpression(parent) && parent.name.text === attribute) {
    const edit = {
      start: parent.getStart(),
      end: parent.getEnd(),
      text: value.expression,
    };

    return edit;
  }

  if (ts.isPropertyAccessExpression(parent)) {
    const dropped = enclosingAttribute(parent);

    const edit = {
      start: dropped.getFullStart(),
      end: dropped.getEnd(),
      text: '',
    };

    return edit;
  }

  throw new Error(`unplaced ${node.getText()}`);
};

const referencesStyles = (node: ts.Node): boolean => {
  return (ts.isIdentifier(node) && node.text === 'styles') || ts.forEachChild(node, referencesStyles) === true;
};

const holdsLookup = (initializer: ts.Expression | undefined): boolean => {
  return initializer !== undefined && !ts.isObjectLiteralExpression(initializer) && referencesStyles(initializer);
};

// Variables holding a looked-up entry, spread later as the element's props.
const derivedNames = (file: ts.SourceFile): Set<string> => {
  const names = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && holdsLookup(node.initializer)) {
      names.add(node.name.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(file);

  return names;
};

const mapText = (map: Table): string => {
  const entries = Object.entries(map)
    .map(([key, value]) => {
      if (typeof value !== 'string') {
        throw new TypeError(`toggle ${key} in an indexed map`);
      }

      return `  ${key}: ${quoted(value)},\n`;
    });

  return `const ${MAP_NAME} = {\n${entries.join('')}};\n\n`;
};

// Runtime code follows the imports and the types, from the first comment above it.
const runtimeStart = (file: ts.SourceFile): number => {
  const statement = file.statements
    .find((node) => {
      return !ts.isImportDeclaration(node) && !ts.isTypeAliasDeclaration(node) && !ts.isInterfaceDeclaration(node);
    });

  if (statement === undefined) {
    throw new Error(`${file.fileName} holds no runtime code`);
  }

  const comments = ts.getLeadingCommentRanges(file.text, statement.getFullStart());
  const comment = comments?.at(0);

  return comment === undefined ? statement.getStart() : comment.pos;
};

// The import's line, and a blank one after it when the import stood alone in its group.
const lineRemoval = (source: string, statement: ts.Statement): Edit => {
  const start = statement.getStart();
  const end = statement.getEnd() + 1;
  const alone = (start === 0 || source.slice(start - 2, start) === '\n\n') && source[end] === '\n';

  const edit = {
    start,
    end: alone ? end + 1 : end,
    text: '',
  };

  return edit;
};

const applied = (text: string, edits: readonly Edit[]): string => {
  return edits
    .toSorted((left, right) => {
      return right.start - left.start;
    })
    .reduce((current, edit) => {
      return current.slice(0, edit.start) + edit.text + current.slice(edit.end);
    }, text);
};

// The shared markup with its `styles` import and every lookup written as plain classes.
export const markupText = (source: string, path: string, file: MarkupFile, attribute: string): string => {
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports = sourceFile.statements.filter(ts.isImportDeclaration);
  const stylesImport = imports
    .find((statement) => {
      return ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.endsWith('.styles');
    });

  if (stylesImport === undefined || !ts.isStringLiteral(stylesImport.moduleSpecifier)) {
    throw new Error(`${path} imports no styles`);
  }

  const cssImport = `import './${basename(stylesImport.moduleSpecifier.text, '.styles')}.css';`;
  const lastImport = imports
    .findLast((statement) => {
      return statement !== stylesImport;
    });
  const derived = derivedNames(sourceFile);
  const edits: Edit[] = [];
  const mapReads: Edit[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isJsxSpreadAttribute(node) && ts.isIdentifier(node.expression) && derived.has(node.expression.text)) {
      edits.push({
        start: node.getStart(),
        end: node.getEnd(),
        text: `${attribute}={${node.expression.text}}`,
      });
    }

    if (ts.isIdentifier(node) && node.text === 'styles' && !ts.isImportSpecifier(node.parent)) {
      if (ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node) {
        edits.push(editOf(file.map, attribute, node.parent));

        return;
      }

      const spread = ts.isElementAccessExpression(node.parent) && ts.isJsxSpreadAttribute(node.parent.parent)
        ? node.parent.parent
        : undefined;
      const renamed = {
        start: node.getStart(),
        end: node.getEnd(),
        text: MAP_NAME,
      };
      const index = node.parent
        .getText()
        .slice('styles'.length);
      const spreadRead = spread === undefined
        ? renamed
        : {
            start: spread.getStart(),
            end: spread.getEnd(),
            text: `${attribute}={${MAP_NAME}${index}}`,
          };

      mapReads.push(spreadRead);

      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (lastImport === undefined) {
    edits.push({
      start: stylesImport.getStart(),
      end: stylesImport.getEnd(),
      text: cssImport,
    });
  }
  else {
    edits.push(
      lineRemoval(source, stylesImport),
      {
        start: lastImport.getEnd(),
        end: lastImport.getEnd(),
        text: `\n\n${cssImport}`,
      },
    );
  }

  edits.push(...mapReads);

  if (mapReads.length > 0) {
    const start = runtimeStart(sourceFile);

    edits.push({
      start,
      end: start,
      text: mapText(file.map),
    });
  }

  return applied(source, edits);
};
