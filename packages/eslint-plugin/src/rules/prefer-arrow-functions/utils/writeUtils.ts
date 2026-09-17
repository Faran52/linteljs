// The emitter: a function node in, the arrow that replaces it out. Nothing here decides
// whether a rewrite is allowed; `safetyUtils.ts` is the other half.
import type { RuleNode, SourceCode } from '../../../utils/ruleUtils.ts';

export interface FunctionId {
  name: string;
}

interface TypeAnnotation {
  type: string;
  asserts?: boolean;
}

type ReturnTypeNode = RuleNode & {
  typeAnnotation: TypeAnnotation;
};

type TypeParametersNode = RuleNode & {
  params: { name: { name: string } }[];
};

// The three function nodes, picked out of the node union, with `returnType` and
// `typeParameters` added since they are TypeScript nodes ESLint's ESTree types have no name for.
export type FunctionLike = Extract<
  RuleNode,
  { type: 'ArrowFunctionExpression' | 'FunctionDeclaration' | 'FunctionExpression' }
> & {
  id?: FunctionId | null;
  returnType?: ReturnTypeNode;
  typeParameters?: TypeParametersNode;
};

export const getFunctionId = (fn: FunctionLike): FunctionId | null => {
  return fn.id ?? null;
};

const renderGenerics = (sourceCode: SourceCode, fn: FunctionLike, isTsx: boolean): string => {
  const { typeParameters } = fn;

  if (!typeParameters) {
    return '';
  }

  const text = sourceCode.getText(typeParameters);

  if (isTsx && typeParameters.params.length === 1) {
    // In a `.tsx` file `<T>(value) => value` reads as a JSX tag, so a lone type parameter needs a trailing
    // comma to stay one (`<T extends string>` becomes `<T extends string,>`); one already there is left alone.
    const innerTrimmed = text.slice(1, -1).trim();
    return innerTrimmed.endsWith(',') ? text : `${text.slice(0, -1)},>`;
  }

  return text;
};

const renderReturnType = (sourceCode: SourceCode, fn: FunctionLike): string => {
  return fn.returnType ? sourceCode.getText(fn.returnType) : '';
};

const renderParams = (sourceCode: SourceCode, fn: FunctionLike): string => {
  return fn.params.map((param) => {
    return sourceCode.getText(param);
  }).join(', ');
};

const renderBody = (sourceCode: SourceCode, fn: FunctionLike): string => {
  const { body } = fn;

  if (body.type !== 'BlockStatement') {
    return `{ return ${sourceCode.getText(body)} }`;
  }

  return sourceCode.getText(body);
};

export const writeArrowFunction = (sourceCode: SourceCode, fn: FunctionLike, isTsx: boolean): string => {
  const asyncPrefix = fn.async === true ? 'async ' : '';
  const generics = renderGenerics(sourceCode, fn, isTsx);
  const params = renderParams(sourceCode, fn);
  const returnType = renderReturnType(sourceCode, fn);
  const body = renderBody(sourceCode, fn);

  return `${asyncPrefix}${generics}(${params})${returnType} => ${body}`;
};

export const writeArrowConstant = (sourceCode: SourceCode, fn: FunctionLike, isTsx: boolean): string => {
  const id = getFunctionId(fn);
  /* v8 ignore next 1 -- only a named declaration reaches this, an anonymous default export is handled separately */
  const name = id ? id.name : '';
  return `const ${name} = ${writeArrowFunction(sourceCode, fn, isTsx)}`;
};
