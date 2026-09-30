import { chainCallNewline } from './chain-call-newline/chainCallNewline.ts';
import { commentDelimiter } from './comment-delimiter/commentDelimiter.ts';
import { destructuringPropertyNewline } from './destructuring-property-newline/destructuringPropertyNewline.ts';
import { exportSpecifierNewline } from './export-specifier-newline/exportSpecifierNewline.ts';
import { importNewlines } from './import-newlines/importNewlines.ts';
import { interfaceOrder } from './interface-order/interfaceOrder.ts';
import { memberNewline } from './member-newline/memberNewline.ts';
import { nativeAccessibleName } from './native-accessible-name/nativeAccessibleName.ts';
import { nativeNoNestedTouchables } from './native-no-nested-touchables/nativeNoNestedTouchables.ts';
import {
  nativeValidAccessibilityActions,
} from './native-valid-accessibility-actions/nativeValidAccessibilityActions.ts';
import { nativeValidAccessibilityRole } from './native-valid-accessibility-role/nativeValidAccessibilityRole.ts';
import { nativeValidAccessibilityState } from './native-valid-accessibility-state/nativeValidAccessibilityState.ts';
import { noDuplicateInterface } from './no-duplicate-interface/noDuplicateInterface.ts';
import { noDuplicateJsxProps } from './no-duplicate-jsx-props/noDuplicateJsxProps.ts';
import { noEslintDisable } from './no-eslint-disable/noEslintDisable.ts';
import { noImportNamespaceDestructure } from './no-import-namespace-destructure/noImportNamespaceDestructure.ts';
import { noInlineObjectTypes } from './no-inline-object-types/noInlineObjectTypes.ts';
import { preferArrowFunctions } from './prefer-arrow-functions/preferArrowFunctions.ts';
import { preferAwaitToThen } from './prefer-await-to-then/preferAwaitToThen.ts';
import { preferDestructuredProps } from './prefer-destructured-props/preferDestructuredProps.ts';
import { preferTryCatch } from './prefer-try-catch/preferTryCatch.ts';
import { reactNoGlobalNamespace } from './react-no-global-namespace/reactNoGlobalNamespace.ts';
import { sortHookDependencies } from './sort-hook-dependencies/sortHookDependencies.ts';
import { unionNewline } from './union-newline/unionNewline.ts';

import type { LintelRuleModule } from '../types.ts';

export type RuleName = keyof typeof rules;

export const rules = {
  'chain-call-newline': chainCallNewline,
  'comment-delimiter': commentDelimiter,
  'destructuring-property-newline': destructuringPropertyNewline,
  'export-specifier-newline': exportSpecifierNewline,
  'import-newlines': importNewlines,
  'interface-order': interfaceOrder,
  'member-newline': memberNewline,
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
  'prefer-arrow-functions': preferArrowFunctions,
  'prefer-await-to-then': preferAwaitToThen,
  'prefer-destructured-props': preferDestructuredProps,
  'prefer-try-catch': preferTryCatch,
  'react-no-global-namespace': reactNoGlobalNamespace,
  'sort-hook-dependencies': sortHookDependencies,
  'union-newline': unionNewline,
} satisfies Record<string, LintelRuleModule>;
