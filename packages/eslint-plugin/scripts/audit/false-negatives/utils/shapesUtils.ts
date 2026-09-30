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
  exportPairCase,
  importBlankLineCase,
  importJoinedCase,
  importLongLineCase,
  importSplitCase,
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

const shape = (build: Build, name: string, options?: Record<string, OptionValue>): Shape => {
  return {
    build,
    shape: name,
    ...(options === undefined ? {} : { options }),
  };
};

// A rule can be awake on the shape someone tested and asleep on the next.
export const SHAPES: Record<string, Shape[]> = {
  'array-newline': [
    shape(patternGapCase('ArrayExpression', false), 'array, last gap closed'),
    shape(patternGapCase('ArrayPattern', false), 'array pattern, last gap closed'),
  ],
  'export-specifier-newline': [
    shape(exportJoinedCase, 'specifiers joined onto one line'),
    shape(exportPairCase('local'), 'second specifier added to a local export'),
    shape(exportPairCase('from'), 'second specifier added to a re-export'),
    shape(exportPairCase('type'), 'second specifier added to a type-only export'),
  ],
  'import-newlines': [
    shape(importJoinedCase, 'joined onto one line, over the item limit'),
    shape(importSplitCase, 'split one per line, under the item limit'),
    shape(importLongLineCase, 'padded past maxLineLength'),
    shape(importTailJoinedCase, 'two members left sharing a line'),
    shape(importBlankLineCase, 'blank line between two members'),
  ],
  'interface-order': [
    shape(typeBelowRuntimeCase('imports'), 'type moved below runtime code, under imports'),
    shape(typeBelowRuntimeCase('directive'), 'type moved below runtime code, under a directive'),
    shape(typeBelowRuntimeCase('none'), 'type moved below runtime code, no header'),
  ],
  'member-newline': [
    shape(patternJoinedCase, 'pattern joined onto one line, over maxProperties'),
    shape(patternBlankLineCase, 'blank line between two properties'),
    shape(patternGapCase('ObjectPattern', false), 'object pattern, last gap closed'),
    shape(patternGapCase('ObjectPattern', true), 'object pattern, first gap closed'),
    shape(typeMembersJoinedCase('TSInterfaceBody', interfaceMembers), 'interface body joined onto one line'),
    shape(typeMembersJoinedCase('TSTypeLiteral', literalMembers), 'type literal joined onto one line'),
  ],
  'no-import-namespace-destructure': [
    shape(namespaceDestructureCase('module'), 'destructured at module scope'),
    shape(namespaceDestructureCase('function'), 'destructured inside a function body'),
    shape(namespaceDestructureCase('block'), 'destructured inside a nested block'),
  ],
  'prefer-arrow-functions': [
    shape(functionDeclarationCase, 'rewritten as a function declaration'),
    shape(functionExpressionCase, 'rewritten as a function expression'),
    shape(propertyFunctionCase(false), 'rewritten as a long-form property value'),
    shape(propertyFunctionCase(true), 'rewritten as a shorthand method'),
    shape(defaultExportFunctionCase, 'rewritten as an anonymous default export'),
    shape(expressionBodyCase, 'block body collapsed to an expression body'),
  ],
  'prefer-await-to-then': [
    shape(detachedHandlerCase('then'), 'detached .then() in statement position'),
    shape(detachedHandlerCase('catch'), 'detached .catch() in statement position'),
    shape(detachedHandlerCase('finally'), 'detached .finally() in statement position'),
    shape(strictAwaitedHandlerCase, 'awaited .then() under strict', { strict: true }),
  ],
  'prefer-destructured-props': [
    shape(arrowComponentCase, 'arrow assigned to an uppercase const, rewritten to a props parameter'),
    shape(functionDeclarationComponentCase, 'function declaration, rewritten to a props parameter'),
  ],
  'prefer-try-catch': [
    shape(awaitedHandlerCase(`.catch(${PROBE_HANDLER})`), 'rejection handler on an await'),
    shape(awaitedHandlerCase(`.then(linteljsFulfilProbe, ${PROBE_HANDLER})`), 'two-argument .then() on an await'),
    shape(
      awaitedHandlerCase(`.catch(${PROBE_HANDLER}).then(linteljsParseProbe)`),
      'rejection handler buried mid-chain',
    ),
    shape(asyncReturnHandlerCase, 'rejection handler on an async return'),
  ],
  'sort-hook-dependencies': [
    shape(hookOrderCase(DEFAULT_HOOKS, 'desc'), 'dependencies sorted the wrong way'),
    shape(hookOrderCase(DEFAULT_HOOKS, 'asc'), 'dependencies sorted ascending under order: desc', { order: 'desc' }),
    shape(
      hookOrderCase(EXTRA_HOOKS, 'desc'),
      'dependencies of a hook named by the hooks option',
      { hooks: EXTRA_HOOKS },
    ),
  ],
  'union-newline': [
    shape(unionWithMemberCase('({ linteljsProbeMember: string })'), 'union with an object member'),
    shape(unionWithMemberCase('(() => void)'), 'union with a function member'),
    shape(unionWithMemberCase('(new () => LintelProbe)'), 'union with a constructor member'),
    shape(unionWithMemberCase('({ [K in LintelProbeKeys]: string })'), 'union with a mapped member'),
    shape(unionGenericCase, 'four plain members inside a generic argument'),
  ],
};
