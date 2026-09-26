import type { Rule } from 'eslint';

export type FixShape = (typeof FIX_SHAPES)[number];

export type RuleLanguage = (typeof RULE_LANGUAGES)[number];

export interface LintelRuleDocs {
  description: string;
  language: RuleLanguage;
  // Whether `configs.recommended` enables it. `configs.all` carries it either way.
  recommended: boolean;
  // What this rule's fixer is allowed to do to the token stream, which `fixerSafety.test.ts` holds it to. Absent
  // means it may rewrite code, which is what `prefer-arrow-functions` does. A rule with no fixer declares nothing.
  fixShape?: FixShape;
  url: string;
}

type BaseMeta = NonNullable<Rule.RuleModule['meta']>;

// The `docs` half of each meta, named so neither is written inline beside the `Omit` that carries it.
interface PublishedDocs {
  docs: LintelRuleDocs;
}

interface AuthoredDocs {
  docs: Omit<LintelRuleDocs, 'url'>;
}

// Omit, not an intersection: intersecting would merge ESLint's deprecated meta.docs.category into ours.
export interface LintelRuleModule extends Omit<Rule.RuleModule, 'meta'> {
  meta: Omit<BaseMeta, 'docs'> & PublishedDocs;
}

interface LintelRuleDefinition {
  meta: Omit<BaseMeta, 'docs'> & AuthoredDocs;
  create: Rule.RuleModule['create'];
}

/**
 * How far a fixer may move the tokens it touches. A rule's domain lives in its id, not here.
 *
 * `whitespace`: the token stream is identical afterwards.
 * `reorder`: the same tokens in a different order.
 */
export const FIX_SHAPES = ['whitespace', 'reorder'] as const;

// Which files a rule can meaningfully run against; a typescript rule wastes a traversal on a .js file.
export const RULE_LANGUAGES = ['universal', 'typescript'] as const;

// Globs matching every file extension the TypeScript parser handles.
export const TYPESCRIPT_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'] as const;

// tree/, not blob/: GitHub renders a directory's README below the listing, landing on doc and source at once.
const DOCS_BASE = 'https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules';

export const docsUrl = (ruleName: string): string => {
  return `${DOCS_BASE}/${ruleName}`;
};

// The only supported way to declare a rule: derives the docs URL and makes language and recommended compulsory.
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
