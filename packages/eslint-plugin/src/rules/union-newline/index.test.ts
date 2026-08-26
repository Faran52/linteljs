import { tsRuleTester } from '@mocks/ruleTesters';

import { unionNewline } from './index.ts';

tsRuleTester.run('union-newline', unionNewline, {
  valid: [
    'type Alpha = string;',
    'type Alpha = { first: string };',
    "type Alpha = 'a' | 'b' | 'c' | 'd' | 'e';",
    'type Alpha = string | number | boolean | symbol;',
    'type Alpha = string | null;',
    'type Alpha =\n  { first: string }\n  | string;',
    'type Alpha =\n  { first: string }\n  | { second: number };',
    'type Alpha =\n  (() => void)\n  | string;',
    'type Alpha =\n  (new () => Thing)\n  | string;',
    'type Alpha =\n  { [K in Key]: string }\n  | string;',
    "type Alpha = Record<'a' | 'b' | 'c', string>;",
    "type Alpha = Partial<Record<'a' | 'b', string>>;",
    "type Alpha = Record<\n  'a'\n  | 'b'\n  | 'c'\n  | 'd', string>;",
  ],
  invalid: [
    {
      // An existing break wider than this file's step is left exactly as written.
      code: 'const pad = {\n  a: 1,\n};\ntype Alpha = { first: string }\n      | { second: string } | string;',
      output: 'const pad = {\n  a: 1,\n};\ntype Alpha = { first: string }\n      | { second: string }\n  | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      // A comment sits in the gap the split would overwrite.
      code: 'type Alpha = { first: string } /* keep */ | string;',
      output: null,
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = { first: string } | string;',
      output: 'type Alpha = { first: string }\n  | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      // The parser drops the parentheses, so the token before `string` is `(`, not the pipe; searching back for the
      // pipe avoids splitting on the wrong side.
      code: 'type Alpha = { first: string } | (string);',
      output: 'type Alpha = { first: string }\n  | (string);',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = { first: string } | { second: number };',
      output: 'type Alpha = { first: string }\n  | { second: number };',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = (() => void) | string;',
      output: 'type Alpha = (() => void)\n  | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = (new () => Thing) | string;',
      output: 'type Alpha = (new () => Thing)\n  | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = { [K in Key]: string } | string;',
      output: 'type Alpha = { [K in Key]: string }\n  | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = string | { first: string } | number;',
      output: 'type Alpha = string\n  | { first: string }\n  | number;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      // Splits past the threshold even though every member is a simple literal.
      code: "type Alpha = Record<'a' | 'b' | 'c' | 'd', string>;",
      output: "type Alpha = Record<'a'\n  | 'b'\n  | 'c'\n  | 'd', string>;",
      errors: [{ messageId: 'genericUnionNewline' }],
    },
    {
      // Partially split still reports: every member must be on its own line.
      code: 'type Alpha = { first: string } | string\n  | number;',
      output: 'type Alpha = { first: string }\n  | string\n  | number;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'function accept(value: { first: string } | string) {\n  return value;\n}',
      output: 'function accept(value: { first: string }\n  | string) {\n  return value;\n}',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'interface Holder {\n  value: { first: string } | string;\n}',
      output: 'interface Holder {\n  value: { first: string }\n    | string;\n}',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
  ],
});

tsRuleTester.run('union-newline (options)', unionNewline, {
  valid: [
    {
      code: "type Alpha = Record<'a' | 'b' | 'c' | 'd', string>;",
      options: [{ maxGenericMembers: 4 }],
    },
    {
      code: "type Alpha = Record<'a' | 'b', string>;",
      options: [{ maxGenericMembers: 2 }],
    },
  ],
  invalid: [
    {
      code: "type Alpha = Record<'a' | 'b' | 'c', string>;",
      output: "type Alpha = Record<'a'\n  | 'b'\n  | 'c', string>;",
      options: [{ maxGenericMembers: 2 }],
      errors: [{ message: 'Union in generic type argument must split when more than 2 members.' }],
    },
    {
      // The message carries the configured value, not the default.
      code: "type Alpha = Record<'a' | 'b' | 'c' | 'd' | 'e', string>;",
      output: "type Alpha = Record<'a'\n  | 'b'\n  | 'c'\n  | 'd'\n  | 'e', string>;",
      options: [{ maxGenericMembers: 4 }],
      errors: [{ message: 'Union in generic type argument must split when more than 4 members.' }],
    },
    {
      // An object member always splits, whatever the threshold is.
      code: 'type Alpha = { first: string } | string;',
      output: 'type Alpha = { first: string }\n  | string;',
      options: [{ maxGenericMembers: 99 }],
      errors: [{ messageId: 'complexUnionNewline' }],
    },
  ],
});
