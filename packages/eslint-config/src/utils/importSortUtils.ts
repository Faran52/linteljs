import type { AliasMap } from '../types';

const BUILTIN_GROUP = ['^node:', '^fs$', '^path$'];

const PACKAGE_GROUP = [String.raw`^@?\w`];

const PARENT_GROUP = [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`];

const SIBLING_GROUP = [String.raw`^\./`];

// simple-import-sort appends a NUL to an `import type` source; `.css` and `.json` sort with their kind instead.
const TYPE_GROUP = [
  String.raw`^(?!.*[.](?:css|json)$)[^.].*\u0000$`,
  String.raw`^[.].*\u0000$`,
];

const STYLE_GROUP = [String.raw`^.+\.s?css$`];

// In dependency direction, so a sorted import block reads top-down as the architecture.
const ALIAS_BUCKETS = [
  ['@config', '@typings'],
  ['@lib', '@store', '@services', '@providers', '@apis', '@utils'],
  ['@hooks', '@composables', '@primitives'],
  ['@ui', '@features', '@components'],
  ['@mocks'],
];

const aliasNameOf = (alias: string): string => {
  return alias.replace(/\/\*$/, '');
};

// Not `RegExp.escape`, which also rewrites `@` and would churn every group.
const REGEX_SPECIAL = /[$^\\.*+?()[\]{}|]/g;

const ESCAPED = '\\$&';

// `/` or end of specifier: a bare barrel alias (`from '@engine'`) otherwise sorted in with node_modules.
const patternFor = (alias: string): string => {
  return `^${aliasNameOf(alias).replace(REGEX_SPECIAL, ESCAPED)}(?:/|$)`;
};

// Unknown aliases sort after the known buckets rather than with node_modules.
const unknownAliasesIn = (aliases: string[]): string[] => {
  const known = new Set(ALIAS_BUCKETS.flat());

  // `'@engine'` and `'@engine/*'` are one alias.
  const patterns = new Set(aliases.filter((alias) => {
    return !known.has(aliasNameOf(alias));
  }).map(patternFor));

  return [...patterns].sort((left, right) => {
    return left.localeCompare(right);
  });
};

const knownAliasGroups = (aliases: string[]): string[][] => {
  const declared = new Set(aliases.map(aliasNameOf));

  return ALIAS_BUCKETS.map((bucket) => {
    return bucket.filter((name) => {
      return declared.has(name);
    }).map(patternFor);
  }).filter((bucket) => {
    return bucket.length > 0;
  });
};

export const buildGroups = (aliases: AliasMap = {}, frameworkGroup?: string[]): string[][] => {
  const declared = Object.keys(aliases);
  const unknown = unknownAliasesIn(declared);

  return [
    BUILTIN_GROUP,
    ...(frameworkGroup && frameworkGroup.length > 0 ? [frameworkGroup] : []),
    PACKAGE_GROUP,
    ...knownAliasGroups(declared),
    ...(unknown.length > 0 ? [unknown] : []),
    PARENT_GROUP,
    SIBLING_GROUP,
    TYPE_GROUP,
    STYLE_GROUP,
  ];
};
