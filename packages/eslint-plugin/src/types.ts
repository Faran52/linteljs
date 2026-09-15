import type { Rule } from 'eslint';

export type RuleCategory = (typeof RULE_CATEGORIES)[number];

export type RuleLanguage = (typeof RULE_LANGUAGES)[number];

export interface LintelRuleDocs {
  description: string;
  category: RuleCategory;
  language: RuleLanguage;
  // Whether `configs.recommended` enables it. Category presets carry it either way.
  recommended: boolean;
  url: string;
}

type BaseMeta = NonNullable<Rule.RuleModule['meta']>;

// Omit, not an intersection: intersecting would merge ESLint's deprecated meta.docs.category into ours.
export interface LintelRuleModule extends Omit<Rule.RuleModule, 'meta'> {
  meta: Omit<BaseMeta, 'docs'> & { docs: LintelRuleDocs };
}

interface LintelRuleDefinition {
  meta: Omit<BaseMeta, 'docs'> & { docs: Omit<LintelRuleDocs, 'url'> };
  create: Rule.RuleModule['create'];
}

// One per rule. The `configs.<category>` presets are generated from this list.
export const RULE_CATEGORIES = [
  'layout',
  'ordering',
  'imports',
  'functions',
  'promises',
] as const;

// Which files a rule can meaningfully run against; a typescript rule wastes a traversal on a .js file.
export const RULE_LANGUAGES = ['universal', 'typescript'] as const;

// Globs matching every file extension the TypeScript parser handles.
export const TYPESCRIPT_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'] as const;

// tree/, not blob/: GitHub renders a directory's README below the listing, landing on doc and source at once.
const DOCS_BASE = 'https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules';

export const docsUrl = (ruleName: string): string => {
  return `${DOCS_BASE}/${ruleName}`;
};

// The only supported way to declare a rule: derives the docs URL and makes category/language compulsory.
export const createRule = (
  name: string,
  definition: LintelRuleDefinition,
): LintelRuleModule => {
  return {
    ...definition,
    meta: {
      ...definition.meta,
      docs: {
        ...definition.meta.docs,
        url: docsUrl(name),
      },
    },
  };
};
