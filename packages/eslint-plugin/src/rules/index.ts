import { commentDelimiter } from './comment-delimiter/index.ts';
import { destructuringPropertyNewline } from './destructuring-property-newline/index.ts';
import { exportSpecifierNewline } from './export-specifier-newline/index.ts';
import { importNewlines } from './import-newlines/index.ts';
import { interfaceOrder } from './interface-order/index.ts';
import { newlineDestructuring } from './newline-destructuring/index.ts';
import { noDuplicateJsxProps } from './no-duplicate-jsx-props/index.ts';
import { noImportNamespaceDestructure } from './no-import-namespace-destructure/index.ts';
import { preferArrowFunctions } from './prefer-arrow-functions/index.ts';
import { preferAwaitToThen } from './prefer-await-to-then/index.ts';
import { preferDestructuredProps } from './prefer-destructured-props/index.ts';
import { preferTryCatch } from './prefer-try-catch/index.ts';
import { sortHookDependencies } from './sort-hook-dependencies/index.ts';
import { unionNewline } from './union-newline/index.ts';

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
  'sort-hook-dependencies': sortHookDependencies,
  'union-newline': unionNewline,
} satisfies Record<string, LintelRuleModule>;
