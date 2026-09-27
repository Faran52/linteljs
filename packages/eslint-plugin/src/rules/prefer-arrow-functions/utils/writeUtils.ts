// The emitter: a function node in, the arrow that replaces it out. Nothing here decides
// whether a rewrite is allowed; `safetyUtils.ts` is the other half.
import {
  type FunctionNode,
  mustFind,
  type NamedNode,
  type RuleNode,
  type SourceCode,
} from '../../../utils/ruleUtils.ts';

interface TypeAnnotation {
  type: string;
  asserts?: boolean;
}

interface Annotated {
  typeAnnotation: TypeAnnotation;
}

type ReturnTypeNode = RuleNode & Annotated;

interface TypeParameter {
  name: NamedNode;
}

interface Parameterised {
  params: TypeParameter[];
}

type TypeParametersNode = RuleNode & Parameterised;

// `returnType` and `typeParameters` are TypeScript nodes ESLint's ESTree types have no name for.
interface FunctionExtras {
  id?: NamedNode | null;
  returnType?: ReturnTypeNode;
  typeParameters?: TypeParametersNode;
}

export type FunctionLike = FunctionNode & FunctionExtras;

export const getFunctionId = (fn: FunctionLike): NamedNode | null => {
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
    const innerTrimmed = text
      .slice(1, -1)
      .trim();
    return innerTrimmed.endsWith(',') ? text : `${text.slice(0, -1)},>`;
  }

  return text;
};

const renderReturnType = (sourceCode: SourceCode, fn: FunctionLike): string => {
  return fn.returnType ? sourceCode.getText(fn.returnType) : '';
};

const renderParams = (sourceCode: SourceCode, fn: FunctionLike): string => {
  return fn.params
    .map((param) => {
      return sourceCode.getText(param);
    })
    .join(', ');
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

// Only a named declaration reaches this; an anonymous default export is written by `writeArrowFunction` alone.
export const writeArrowConstant = (sourceCode: SourceCode, fn: FunctionLike, isTsx: boolean): string => {
  const { name } = mustFind(getFunctionId(fn), 'the name of a function declaration');

  return `const ${name} = ${writeArrowFunction(sourceCode, fn, isTsx)}`;
};
