import { arrayNewline } from './array-newline/arrayNewlineRule.ts';
import { chainCallNewline } from './chain-call-newline/chainCallNewlineRule.ts';
import { commentDelimiter } from './comment-delimiter/commentDelimiterRule.ts';
import { exportSpecifierNewline } from './export-specifier-newline/exportSpecifierNewlineRule.ts';
import { importNewlines } from './import-newlines/importNewlinesRule.ts';
import { interfaceOrder } from './interface-order/interfaceOrderRule.ts';
import { memberNewline } from './member-newline/memberNewlineRule.ts';
import { nameBeforeUse } from './name-before-use/nameBeforeUseRule.ts';
import { nativeAccessibleName } from './native-accessible-name/nativeAccessibleNameRule.ts';
import { nativeNoNestedTouchables } from './native-no-nested-touchables/nativeNoNestedTouchablesRule.ts';
import {
  nativeValidAccessibilityActions,
} from './native-valid-accessibility-actions/nativeValidAccessibilityActionsRule.ts';
import { nativeValidAccessibilityRole } from './native-valid-accessibility-role/nativeValidAccessibilityRoleRule.ts';
import { nativeValidAccessibilityState } from './native-valid-accessibility-state/nativeValidAccessibilityStateRule.ts';
import { noDuplicateInterface } from './no-duplicate-interface/noDuplicateInterfaceRule.ts';
import { noDuplicateJsxProps } from './no-duplicate-jsx-props/noDuplicateJsxPropsRule.ts';
import { noEslintDisable } from './no-eslint-disable/noEslintDisableRule.ts';
import { noImportNamespaceDestructure } from './no-import-namespace-destructure/noImportNamespaceDestructureRule.ts';
import { noInlineObjectTypes } from './no-inline-object-types/noInlineObjectTypesRule.ts';
import { preferAlias } from './prefer-alias/preferAliasRule.ts';
import { preferArrowFunctions } from './prefer-arrow-functions/preferArrowFunctionsRule.ts';
import { preferAwaitToThen } from './prefer-await-to-then/preferAwaitToThenRule.ts';
import { preferDestructuredProps } from './prefer-destructured-props/preferDestructuredPropsRule.ts';
import { preferTryCatch } from './prefer-try-catch/preferTryCatchRule.ts';
import { reactNoGlobalNamespace } from './react-no-global-namespace/reactNoGlobalNamespaceRule.ts';
import { sortHookDependencies } from './sort-hook-dependencies/sortHookDependenciesRule.ts';
import { unionNewline } from './union-newline/unionNewlineRule.ts';

import type { LintelRuleModule } from '../types.ts';

export type RuleName = keyof typeof rules;

export const rules = {
  'array-newline': arrayNewline,
  'chain-call-newline': chainCallNewline,
  'comment-delimiter': commentDelimiter,
  'export-specifier-newline': exportSpecifierNewline,
  'import-newlines': importNewlines,
  'interface-order': interfaceOrder,
  'member-newline': memberNewline,
  'name-before-use': nameBeforeUse,
  'native-accessible-name': nativeAccessibleName,
  'native-no-nested-touchables': nativeNoNestedTouchables,
  'native-valid-accessibility-actions': nativeValidAccessibilityActions,
  'native-valid-accessibility-role': nativeValidAccessibilityRole,
  'native-valid-accessibility-state': nativeValidAccessibilityState,
  'no-duplicate-interface': noDuplicateInterface,
  'no-duplicate-jsx-props': noDuplicateJsxProps,
  'no-eslint-disable': noEslintDisable,
  'no-inline-object-types': noInlineObjectTypes,
  'no-import-namespace-destructure': noImportNamespaceDestructure,
  'prefer-alias': preferAlias,
  'prefer-arrow-functions': preferArrowFunctions,
  'prefer-await-to-then': preferAwaitToThen,
  'prefer-destructured-props': preferDestructuredProps,
  'prefer-try-catch': preferTryCatch,
  'react-no-global-namespace': reactNoGlobalNamespace,
  'sort-hook-dependencies': sortHookDependencies,
  'union-newline': unionNewline,
} satisfies Record<string, LintelRuleModule>;
