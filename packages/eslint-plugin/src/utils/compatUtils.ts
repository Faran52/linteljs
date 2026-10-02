import type { Scope } from 'eslint';
import type {
  Ancestor,
  AncestorReader,
  RuleNode,
  SourceCode,
} from './ruleUtils.ts';

// Every member optional: an older RuleContext lacks some structurally.
export interface CompatContext {
  sourceCode?: SourceCode;
  physicalFilename?: string;
  filename?: string;
  getSourceCode?: () => SourceCode;
  getPhysicalFilename?: () => string;
  getFilename?: () => string;
  getScope?: () => Scope.Scope;
  getAncestors?: () => Ancestor[];
  getDeclaredVariables?: (node: RuleNode) => Scope.Variable[];
}

// Modern scope readers take a node, legacy ones do not.
export interface CompatSourceCode {
  // Method syntax on purpose: bivariant node parameter, the only position a real SourceCode satisfies.
  getScope?(node: RuleNode): Scope.Scope;
  getAncestors?(node: Ancestor): Ancestor[];
  getDeclaredVariables?(node: RuleNode): Scope.Variable[];
}

const compatCode = (sourceCode: SourceCode): CompatSourceCode => {
  return sourceCode;
};

const required = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) {
    throw new Error(`@linteljs/eslint-plugin needs ${name}, which this version of ESLint does not provide`);
  }

  return value;
};

export const sourceCodeOf = (context: CompatContext): SourceCode => {
  return required(context.sourceCode ?? context.getSourceCode?.(), 'a SourceCode');
};

// The on-disk path, not what a processor reports.
export const physicalFilenameOf = (context: CompatContext): string => {
  return required(
    context.physicalFilename
    ?? context.getPhysicalFilename?.()
    ?? context.filename
    ?? context.getFilename?.(),
    'a filename',
  );
};

// Split out so the fallback is reachable directly: real ESLint 10 always has the node-taking readers.
export const scopeIn = (
  code: CompatSourceCode,
  context: CompatContext,
  node: RuleNode,
): Scope.Scope => {
  return required(code.getScope?.(node) ?? context.getScope?.(), 'a scope');
};

export const ancestorsIn = (
  code: CompatSourceCode,
  context: CompatContext,
  node: Ancestor,
): Ancestor[] => {
  return required(code.getAncestors?.(node) ?? context.getAncestors?.(), 'the ancestors');
};

export const declaredVariablesIn = (
  code: CompatSourceCode,
  context: CompatContext,
  node: RuleNode,
): Scope.Variable[] => {
  return required(
    code.getDeclaredVariables?.(node) ?? context.getDeclaredVariables?.(node),
    'the declared variables',
  );
};

export const scopeOf = (context: CompatContext, node: RuleNode): Scope.Scope => {
  const code = compatCode(sourceCodeOf(context));

  return scopeIn(code, context, node);
};

export const ancestorsOf = (context: CompatContext, node: Ancestor): Ancestor[] => {
  const code = compatCode(sourceCodeOf(context));

  return ancestorsIn(code, context, node);
};

export const declaredVariablesOf = (context: CompatContext, node: RuleNode): Scope.Variable[] => {
  const code = compatCode(sourceCodeOf(context));

  return declaredVariablesIn(code, context, node);
};

export const ancestorReaderOf = (context: CompatContext): AncestorReader => {
  return {
    getAncestors: (node) => {
      return ancestorsOf(context, node);
    },
  };
};
