import { posix } from 'node:path';

import { sourceCodeOf } from '../../utils/compatUtils.ts';
import {
  createRule,
  optionsOf,
  type SourceCode,
} from '../../utils/ruleUtils.ts';

import {
  type Alias,
  aliasedProjectOf,
  aliasHolding,
  aliasMatching,
  matchesGlob,
  pathOf,
  relativeBetween,
  throughAlias,
} from './utils/aliasUtils.ts';

import type { Rule } from 'eslint';
import type { Node, Program } from 'typescript';

type SourceNode = NonNullable<Parameters<SourceCode['getText']>[0]>;

interface Options {
  aliasExempt: string[];
  enforceRelativeImports: boolean;
}

// typescript-eslint's services, which ESLint types as `any`.
interface NodeMap {
  get: (node: SourceNode) => Node;
}

interface TypedServices {
  program?: Program | null;
  esTreeNodeToTSNodeMap: NodeMap;
}

// ESLint 6 to 10 default `parserServices` to `{}`.
interface ServicesHost {
  parserServices: Partial<TypedServices>;
}

interface Typed {
  program: Program;
  nodeOf: (node: SourceNode) => Node;
}

interface SourceHolder {
  source?: SourceNode | null | undefined;
}

const typedOf = ({ parserServices }: ServicesHost): Typed | undefined => {
  const { program } = parserServices;
  const map = parserServices.esTreeNodeToTSNodeMap;

  return program && map
    ? {
        program,
        nodeOf: (node) => {
          return map.get(node);
        },
      }
    : undefined;
};

export const preferAlias = createRule('prefer-alias', {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      language: 'typescript',
      recommended: true,
      requiresTypeChecking: true,
      description: 'Import across aliased directories through the tsconfig alias, and within one relatively.',
    },
    messages: {
      preferAlias: "Import '{{replacement}}': '{{specifier}}' reaches into another aliased directory.",
      preferRelative: "Import '{{replacement}}': '{{specifier}}' points back into this file's own aliased directory.",
      exemptRelative: "Import '{{replacement}}': this file takes relative imports only.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          aliasExempt: {
            type: 'array',
            items: { type: 'string' },
          },
          enforceRelativeImports: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    const sourceCode = sourceCodeOf(context);
    const typed = typedOf(sourceCode);
    const project = typed && aliasedProjectOf(typed.program.getCompilerOptions());

    // Untyped, or a project with no `paths`: nothing to prefer.
    if (!typed || !project) {
      return {};
    }

    const {
      base,
      aliases,
      pinned,
    } = project;
    // The schema default fills `enforceRelativeImports` whenever an options object exists.
    const { aliasExempt = [], enforceRelativeImports } = optionsOf<Options>(context);
    const checker = typed.program.getTypeChecker();

    const report = (node: SourceNode, messageId: string, specifier: string, replacement: string): void => {
      context.report({
        node,
        messageId,
        data: {
          specifier,
          replacement,
        },
        fix: (fixer) => {
          const quote = sourceCode
            .getText(node)
            .charAt(0);

          return fixer.replaceText(node, `${quote}${replacement}${quote}`);
        },
      });
    };

    const checkSource = (node: SourceNode, specifier: string): void => {
      const tsNode = typed.nodeOf(node);
      const file = tsNode.getSourceFile().fileName;
      // What tsc resolved the specifier to, or nothing to rewrite.
      const resolved = checker
        .getSymbolAtLocation(tsNode)?.declarations?.[0]
        ?.getSourceFile().fileName;

      if (resolved === undefined) {
        return;
      }

      const own = aliasHolding(aliases, file);
      const exempt = aliasExempt
        .some((glob) => {
          const relativePath = posix.relative(base, file);

          return matchesGlob(glob, relativePath);
        });

      if (specifier.startsWith('.')) {
        const path = posix.join(posix.dirname(file), specifier);
        const alias = exempt || !specifier.startsWith('../') ? undefined : aliasHolding(aliases, path);

        if (!alias || alias === own) {
          return;
        }

        const replacement = throughAlias(alias, path);

        // Only when tsc would read the alias back to the same path.
        if (!pinned.includes(replacement) && aliasMatching(aliases, replacement) === alias) {
          report(node, 'preferAlias', specifier, replacement);
        }

        return;
      }

      const alias: Alias | undefined = pinned.includes(specifier) ? undefined : aliasMatching(aliases, specifier);

      // A later fallback in the `paths` entry resolved it, so the first one is not where it points.
      if (!alias || !resolved.startsWith(`${alias.directory}/`)) {
        return;
      }

      const path = pathOf(alias, specifier);
      const replacement = relativeBetween(file, path);

      if (exempt) {
        if (enforceRelativeImports) {
          report(node, 'exemptRelative', specifier, replacement);
        }

        return;
      }

      if (aliasHolding(aliases, path) === own) {
        report(node, 'preferRelative', specifier, replacement);
      }
    };

    const check = ({ source }: SourceHolder): void => {
      if (source?.type === 'Literal' && typeof source.value === 'string') {
        checkSource(source, source.value);
      }
    };

    const listeners: Rule.RuleListener = {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };

    return listeners;
  },
});
