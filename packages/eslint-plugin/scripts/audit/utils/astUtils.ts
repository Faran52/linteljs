import { createRequire } from 'node:module';
import { extname } from 'node:path';

import tseslint from 'typescript-eslint';

export type Range = [number, number];

interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

export interface Token {
  type: string;
  value: string;
  range: Range;
  loc: SourceLocation;
}

// ESLint's ESTree types have no TypeScript nodes.
export interface AstNode {
  type: string;
  range: Range;
  loc: SourceLocation;
  parent?: AstNode | undefined;
  argument?: AstNode | null;
  arguments?: AstNode[];
  async?: boolean;
  body?: AstNode | AstNode[];
  callee?: AstNode;
  computed?: boolean;
  declaration?: AstNode | null;
  declarations?: AstNode[];
  directive?: string;
  elements?: (AstNode | null)[];
  exportKind?: string;
  exported?: AstNode;
  expression?: AstNode | boolean;
  id?: AstNode | null;
  init?: AstNode | null;
  key?: AstNode;
  kind?: string;
  label?: AstNode | null;
  left?: AstNode;
  local?: AstNode;
  members?: AstNode[];
  meta?: AstNode;
  method?: boolean;
  name?: string;
  param?: AstNode | null;
  params?: AstNode[];
  properties?: AstNode[];
  property?: AstNode;
  returnType?: AstNode;
  shorthand?: boolean;
  source?: AstNode | null;
  specifiers?: AstNode[];
  typeAnnotation?: AstNode;
  typeParameters?: AstNode;
  value?: AstNode | boolean | number | string | null;
}

export interface Program extends AstNode {
  body: AstNode[];
  tokens: Token[];
  comments: Token[];
}

interface Parser {
  parse: (text: string, options: object) => unknown;
}

interface ParseResult {
  ast: unknown;
}

interface EslintParser {
  parseForESLint: (text: string, options: object) => ParseResult;
}

// Tokens carry a `type` and would otherwise be walked as nodes.
const NOT_CHILDREN = new Set([
  'comments',
  'loc',
  'parent',
  'range',
  'tokens',
]);

const isAstNode = (value: unknown): value is AstNode => {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
    && 'range' in value && Array.isArray(value.range);
};

const isProgram = (value: unknown): value is Program => {
  return isAstNode(value) && 'tokens' in value && Array.isArray(value.tokens)
    && 'comments' in value && Array.isArray(value.comments) && Array.isArray(value.body);
};

const isParser = (value: unknown): value is Parser => {
  return typeof value === 'object' && value !== null && 'parse' in value && typeof value.parse === 'function';
};

const isEslintParser = (value: unknown): value is EslintParser => {
  return typeof value === 'object' && value !== null
    && 'parseForESLint' in value && typeof value.parseForESLint === 'function';
};

// espree ships inside ESLint; resolved through it because pnpm hoists no transitive dependency.
const eslintEntry = createRequire(import.meta.url).resolve('eslint');
const espreeModule: unknown = createRequire(eslintEntry)('espree');

if (!isParser(espreeModule) || !isEslintParser(tseslint.parser)) {
  throw new Error('espree or typescript-eslint no longer exposes the parse function this audit calls');
}

const espree = espreeModule;
const typescriptParser: EslintParser = tseslint.parser;

// Spelled out: the harness parses directly as well as through the Linter.
const JS_PARSE = {
  ecmaFeatures: { jsx: true },
  comment: true,
  ecmaVersion: 'latest',
  loc: true,
  range: true,
  tokens: true,
};

export const isTypeScript = (name: string): boolean => {
  return name === 'file.ts' || name === 'file.tsx';
};

export const parse = (source: string, name: string): Program => {
  const ast = isTypeScript(name)
    ? typescriptParser.parseForESLint(source, { filePath: name }).ast
    : espree.parse(source, {
        ...JS_PARSE,
        // Flat config reads `.cjs` as CommonJS and everything else as a module.
        sourceType: name === 'file.cjs' ? 'commonjs' : 'module',
      });

  if (!isProgram(ast)) {
    throw new Error(`${name} parsed to something that is not a Program`);
  }

  return ast;
};

export const parseOrNull = (source: string, name: string): Program | null => {
  try {
    return parse(source, name);
  }
  catch {
    return null;
  }
};

// `.tsx` unlocks JSX; a `.js` on disk may be CommonJS, which a probe settles once.
export const nameFor = (file: string, source: string): string => {
  const extension = extname(file);

  if (extension === '.ts' || extension === '.tsx') {
    return `file${extension}`;
  }

  if (extension === '.cjs' || extension === '.mjs') {
    return extension === '.cjs' ? 'file.cjs' : 'file.js';
  }

  return parseOrNull(source, 'file.js') ? 'file.js' : 'file.cjs';
};

// `Reflect.get`, because a node's keys are whatever its parser wrote.
export const childrenOf = (node: AstNode): [string, AstNode][] => {
  const found: [string, AstNode][] = [];

  for (const key of Object.keys(node)) {
    if (NOT_CHILDREN.has(key)) {
      continue;
    }

    const value: unknown = Reflect.get(node, key);
    const items: unknown[] = Array.isArray(value) ? value : [value];

    for (const item of items) {
      if (isAstNode(item)) {
        found.push([key, item]);
      }
    }
  }

  return found;
};

export const walkAst = (
  node: AstNode,
  visit: (node: AstNode, parent: AstNode | undefined, key: string | undefined) => boolean,
  parent?: AstNode,
  key?: string,
): void => {
  if (!visit(node, parent, key)) {
    return;
  }

  for (const [childKey, child] of childrenOf(node)) {
    walkAst(child, visit, node, childKey);
  }
};

export const nodeOf = (value: AstNode['value'] | AstNode[]): AstNode | undefined => {
  return isAstNode(value) ? value : undefined;
};

export const listOf = (value: AstNode | AstNode[] | undefined): AstNode[] => {
  return Array.isArray(value) ? value : [];
};
