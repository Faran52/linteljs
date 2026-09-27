import type { Rule } from 'eslint';
import type { FIX_SHAPES, RULE_LANGUAGES } from './constants.ts';

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

export interface LintelRuleDefinition {
  meta: Omit<BaseMeta, 'docs'> & AuthoredDocs;
  create: Rule.RuleModule['create'];
}
