import {
  arrowComponentCase,
  asyncReturnHandlerCase,
  awaitedHandlerCase,
  DEFAULT_HOOKS,
  defaultExportFunctionCase,
  detachedHandlerCase,
  expressionBodyCase,
  EXTRA_HOOKS,
  functionDeclarationCase,
  functionDeclarationComponentCase,
  functionExpressionCase,
  hookOrderCase,
  namespaceDestructureCase,
  PROBE_HANDLER,
  propertyFunctionCase,
  strictAwaitedHandlerCase,
} from './functionShapesUtils.ts';
import {
  exportJoinedCase,
  exportTripleCase,
  importBlankLineCase,
  importJoinedCase,
  importTailJoinedCase,
  interfaceMembers,
  literalMembers,
  patternBlankLineCase,
  patternGapCase,
  patternJoinedCase,
  typeBelowRuntimeCase,
  typeMembersJoinedCase,
  unionGenericCase,
  unionWithMemberCase,
} from './layoutShapesUtils.ts';

import type { OptionValue } from '../../utils/optionUtils.ts';
import type { Build } from './editUtils.ts';

export interface Shape {
  build: Build;
  options?: Record<string, OptionValue>;
  shape: string;
}

// Both visit TypeScript nodes only, so a JavaScript file can never exercise them.
export const TS_ONLY_RULES = new Set(['interface-order', 'union-newline']);

// A rule can be awake on the shape someone tested and asleep on the next.
export const SHAPES: Record<string, Shape[]> = {
  'array-newline': [
    {
      build: patternGapCase('ArrayExpression', false),
      shape: 'array, last gap closed',
    },
    {
      build: patternGapCase('ArrayPattern', false),
      shape: 'array pattern, last gap closed',
    },
  ],
  'export-specifier-newline': [
    {
      build: exportJoinedCase,
      shape: 'specifiers joined onto one line',
    },
    {
      build: exportTripleCase('local'),
      shape: 'two specifiers added to a local export',
    },
    {
      build: exportTripleCase('from'),
      shape: 'two specifiers added to a re-export',
    },
    {
      build: exportTripleCase('type'),
      shape: 'two specifiers added to a type-only export',
    },
  ],
  'import-newlines': [
    {
      build: importJoinedCase,
      shape: 'joined onto one line, over the item limit',
    },
    {
      build: importTailJoinedCase,
      shape: 'two members left sharing a line',
    },
    {
      build: importBlankLineCase,
      shape: 'blank line between two members',
    },
  ],
  'interface-order': [
    {
      build: typeBelowRuntimeCase('imports'),
      shape: 'type moved below runtime code, under imports',
    },
    {
      build: typeBelowRuntimeCase('directive'),
      shape: 'type moved below runtime code, under a directive',
    },
    {
      build: typeBelowRuntimeCase('none'),
      shape: 'type moved below runtime code, no header',
    },
  ],
  'member-newline': [
    {
      build: patternJoinedCase,
      shape: 'pattern joined onto one line, over maxProperties',
    },
    {
      build: patternBlankLineCase,
      shape: 'blank line between two properties',
    },
    {
      build: patternGapCase('ObjectPattern', false),
      shape: 'object pattern, last gap closed',
    },
    {
      build: patternGapCase('ObjectPattern', true),
      shape: 'object pattern, first gap closed',
    },
    {
      build: typeMembersJoinedCase('TSInterfaceBody', interfaceMembers),
      shape: 'interface body joined onto one line',
    },
    {
      build: typeMembersJoinedCase('TSTypeLiteral', literalMembers),
      shape: 'type literal joined onto one line',
    },
  ],
  'no-import-namespace-destructure': [
    {
      build: namespaceDestructureCase('module'),
      shape: 'destructured at module scope',
    },
    {
      build: namespaceDestructureCase('function'),
      shape: 'destructured inside a function body',
    },
    {
      build: namespaceDestructureCase('block'),
      shape: 'destructured inside a nested block',
    },
  ],
  'prefer-arrow-functions': [
    {
      build: functionDeclarationCase,
      shape: 'rewritten as a function declaration',
    },
    {
      build: functionExpressionCase,
      shape: 'rewritten as a function expression',
    },
    {
      build: propertyFunctionCase(false),
      shape: 'rewritten as a long-form property value',
    },
    {
      build: propertyFunctionCase(true),
      shape: 'rewritten as a shorthand method',
    },
    {
      build: defaultExportFunctionCase,
      shape: 'rewritten as an anonymous default export',
    },
    {
      build: expressionBodyCase,
      shape: 'block body collapsed to an expression body',
    },
  ],
  'prefer-await-to-then': [
    {
      build: detachedHandlerCase('then'),
      shape: 'detached .then() in statement position',
    },
    {
      build: detachedHandlerCase('catch'),
      shape: 'detached .catch() in statement position',
    },
    {
      build: detachedHandlerCase('finally'),
      shape: 'detached .finally() in statement position',
    },
    {
      build: strictAwaitedHandlerCase,
      options: { strict: true },
      shape: 'awaited .then() under strict',
    },
  ],
  'prefer-destructured-props': [
    {
      build: arrowComponentCase,
      shape: 'arrow assigned to an uppercase const, rewritten to a props parameter',
    },
    {
      build: functionDeclarationComponentCase,
      shape: 'function declaration, rewritten to a props parameter',
    },
  ],
  'prefer-try-catch': [
    {
      build: awaitedHandlerCase(`.catch(${PROBE_HANDLER})`),
      shape: 'rejection handler on an await',
    },
    {
      build: awaitedHandlerCase(`.then(linteljsFulfilProbe, ${PROBE_HANDLER})`),
      shape: 'two-argument .then() on an await',
    },
    {
      build: awaitedHandlerCase(`.catch(${PROBE_HANDLER}).then(linteljsParseProbe)`),
      shape: 'rejection handler buried mid-chain',
    },
    {
      build: asyncReturnHandlerCase,
      shape: 'rejection handler on an async return',
    },
  ],
  'sort-hook-dependencies': [
    {
      build: hookOrderCase(DEFAULT_HOOKS, 'desc'),
      shape: 'dependencies sorted the wrong way',
    },
    {
      build: hookOrderCase(DEFAULT_HOOKS, 'asc'),
      options: { order: 'desc' },
      shape: 'dependencies sorted ascending under order: desc',
    },
    {
      build: hookOrderCase(EXTRA_HOOKS, 'desc'),
      options: { hooks: EXTRA_HOOKS },
      shape: 'dependencies of a hook named by the hooks option',
    },
  ],
  'union-newline': [
    {
      build: unionWithMemberCase('({ linteljsProbeMember: string })'),
      shape: 'union with an object member',
    },
    {
      build: unionWithMemberCase('(() => void)'),
      shape: 'union with a function member',
    },
    {
      build: unionWithMemberCase('(new () => LintelProbe)'),
      shape: 'union with a constructor member',
    },
    {
      build: unionWithMemberCase('({ [K in LintelProbeKeys]: string })'),
      shape: 'union with a mapped member',
    },
    {
      build: unionGenericCase,
      shape: 'four plain members inside a generic argument',
    },
  ],
};
