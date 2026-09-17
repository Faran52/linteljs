import { commentDelimiter } from './comment-delimiter/commentDelimiter.ts';
import { destructuringPropertyNewline } from './destructuring-property-newline/destructuringPropertyNewline.ts';
import { exportSpecifierNewline } from './export-specifier-newline/exportSpecifierNewline.ts';
import { importNewlines } from './import-newlines/importNewlines.ts';
import { interfaceOrder } from './interface-order/interfaceOrder.ts';
import { newlineDestructuring } from './newline-destructuring/newlineDestructuring.ts';
import { noDuplicateJsxProps } from './no-duplicate-jsx-props/noDuplicateJsxProps.ts';
import { noImportNamespaceDestructure } from './no-import-namespace-destructure/noImportNamespaceDestructure.ts';
import { preferArrowFunctions } from './prefer-arrow-functions/preferArrowFunctions.ts';
import { preferAwaitToThen } from './prefer-await-to-then/preferAwaitToThen.ts';
import { preferDestructuredProps } from './prefer-destructured-props/preferDestructuredProps.ts';
import { preferTryCatch } from './prefer-try-catch/preferTryCatch.ts';
import { reactNativeAccessibleName } from './react-native-accessible-name/reactNativeAccessibleName.ts';
import { reactNativeNoNestedTouchables } from './react-native-no-nested-touchables/reactNativeNoNestedTouchables.ts';
import {
  reactNativeValidAccessibilityActions,
} from './react-native-valid-accessibility-actions/reactNativeValidAccessibilityActions.ts';
import {
  reactNativeValidAccessibilityRole,
} from './react-native-valid-accessibility-role/reactNativeValidAccessibilityRole.ts';
import {
  reactNativeValidAccessibilityState,
} from './react-native-valid-accessibility-state/reactNativeValidAccessibilityState.ts';
import { sortHookDependencies } from './sort-hook-dependencies/sortHookDependencies.ts';
import { unionNewline } from './union-newline/unionNewline.ts';

import type { LintelRuleModule } from '../types.ts';

export type RuleName = keyof typeof rules;

// The rule registry: a new rule needs only an entry here, since configs and contract tests are generated from it
// (the README table is hand-edited). Each key also names the directory its rule lives in.
export const rules = {
  'comment-delimiter': commentDelimiter,
  'destructuring-property-newline': destructuringPropertyNewline,
  'export-specifier-newline': exportSpecifierNewline,
  'import-newlines': importNewlines,
  'interface-order': interfaceOrder,
  'newline-destructuring': newlineDestructuring,
  'no-duplicate-jsx-props': noDuplicateJsxProps,
  'no-import-namespace-destructure': noImportNamespaceDestructure,
  'prefer-arrow-functions': preferArrowFunctions,
  'prefer-await-to-then': preferAwaitToThen,
  'prefer-destructured-props': preferDestructuredProps,
  'prefer-try-catch': preferTryCatch,
  'react-native-accessible-name': reactNativeAccessibleName,
  'react-native-no-nested-touchables': reactNativeNoNestedTouchables,
  'react-native-valid-accessibility-actions': reactNativeValidAccessibilityActions,
  'react-native-valid-accessibility-role': reactNativeValidAccessibilityRole,
  'react-native-valid-accessibility-state': reactNativeValidAccessibilityState,
  'sort-hook-dependencies': sortHookDependencies,
  'union-newline': unionNewline,
} satisfies Record<string, LintelRuleModule>;
