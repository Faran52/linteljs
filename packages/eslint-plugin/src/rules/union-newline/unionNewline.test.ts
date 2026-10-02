import { tsRuleTester } from '@mocks/ruleTesters';

import { unionNewline } from './unionNewline.ts';

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
    'type Alpha =\n  | { first: string }\n  | string;',
    'type Alpha = { first: string } |\n  string;',
    'type Alpha = ({ first: string } & Base) | string;',
    'type Alpha = { first: string } & { second: number };',
    'type Alpha<Value extends 1 | 2 | 3 | 4> = Value;',
    'type Alpha = () => string | number | boolean | symbol;',
    'type Alpha = `a${string}` | `b${string}` | `c${string}` | `d${string}`;',
    'type Alpha = string | (number | boolean | symbol | bigint);',
    'type Alpha = Array<string[] | number[] | boolean[]>;',
    "type Alpha = Record<\n  | 'a'\n  | 'b'\n  | 'c'\n  | 'd',\n  string\n>;",
  ],
  invalid: [
    {
      code: 'const pad = {\n  a: 1,\n};\ntype Alpha = { first: string }\n      | { second: string } | string;',
      output: 'const pad = {\n  a: 1,\n};\ntype Alpha = { first: string }\n      | { second: string }\n  | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
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
      code: "type Alpha = Record<'a' | 'b' | 'c' | 'd', string>;",
      output: "type Alpha = Record<'a'\n  | 'b'\n  | 'c'\n  | 'd', string>;",
      errors: [{ messageId: 'genericUnionNewline' }],
    },
    {
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
    {
      code: 'type Alpha = { first: string } | second /* keep */ | third;',
      output: null,
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = { first: string } // keep\n  | string | number;',
      output: 'type Alpha = { first: string } // keep\n  | string\n  | number;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = { first: string } | /* keep */ string;',
      output: 'type Alpha = { first: string }\n  | /* keep */ string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha =\n  | { first: string } | string;',
      output: 'type Alpha =\n  | { first: string }\n  | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = | { first: string } | string;',
      output: 'type Alpha = | { first: string }\n  | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha =\n  ({ first: string }) | string;',
      output: 'type Alpha =\n  ({ first: string })\n    | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha =\n  /* lead */ | { first: string } | string;',
      output: 'type Alpha =\n  /* lead */ | { first: string }\n    | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: "type Alpha = Record<\n  | 'a' | 'b' | 'c' | 'd',\n  string\n>;",
      output: "type Alpha = Record<\n  | 'a'\n  | 'b'\n  | 'c'\n  | 'd',\n  string\n>;",
      errors: [{ messageId: 'genericUnionNewline' }],
    },
    {
      code: 'type Alpha = {\n  first: string;\n} | string;',
      output: 'type Alpha = {\n  first: string;\n}\n  | string;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = { first: string } | (Second | Third);',
      output: 'type Alpha = { first: string }\n  | (Second | Third);',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = { first: string } | (| Second | Third);',
      output: 'type Alpha = { first: string }\n  | (| Second | Third);',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = { first: 1 | { second: string } };',
      output: 'type Alpha = { first: 1\n  | { second: string } };',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = (Base & { first: string }) | (() => void);',
      output: 'type Alpha = (Base & { first: string })\n  | (() => void);',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = { first: string } | (() => { second: 1 | 2 });',
      output: 'type Alpha = { first: string }\n  | (() => { second: 1 | 2 });',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = `a${string}` | { first: string };',
      output: 'type Alpha = `a${string}`\n  | { first: string };',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'type Alpha = Promise<{ first: string } | string>;',
      output: 'type Alpha = Promise<{ first: string }\n  | string>;',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: "type Alpha = Map<1 | 2 | 3 | 4, 'a' | 'b' | 'c' | 'd'>;",
      output: "type Alpha = Map<1\n  | 2\n  | 3\n  | 4, 'a'\n  | 'b'\n  | 'c'\n  | 'd'>;",
      errors: [{ messageId: 'genericUnionNewline' }, { messageId: 'genericUnionNewline' }],
    },
    {
      code: 'type Alpha = Holder<(1 | 2 | 3 | 4)>;',
      output: 'type Alpha = Holder<(1\n  | 2\n  | 3\n  | 4)>;',
      errors: [{ messageId: 'genericUnionNewline' }],
    },
    {
      code: 'type Alpha = Outer<Inner<1 | 2 | 3 | 4>>;',
      output: 'type Alpha = Outer<Inner<1\n  | 2\n  | 3\n  | 4>>;',
      errors: [{ messageId: 'genericUnionNewline' }],
    },
    {
      code: 'type Alpha = { first: string } | string;\r\nconst other = 1;\r\n',
      output: 'type Alpha = { first: string }\r\n  | string;\r\nconst other = 1;\r\n',
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: 'interface Holder {\n\tvalue: { first: string } | string;\n}',
      output: 'interface Holder {\n\tvalue: { first: string }\n\t\t| string;\n}',
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
    {
      code: "type Alpha = Record<'a', string>;",
      options: [{ maxGenericMembers: 1 }],
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
      code: "type Alpha = Record<'a' | 'b' | 'c' | 'd' | 'e', string>;",
      output: "type Alpha = Record<'a'\n  | 'b'\n  | 'c'\n  | 'd'\n  | 'e', string>;",
      options: [{ maxGenericMembers: 4 }],
      errors: [{ message: 'Union in generic type argument must split when more than 4 members.' }],
    },
    {
      code: 'type Alpha = { first: string } | string;',
      output: 'type Alpha = { first: string }\n  | string;',
      options: [{ maxGenericMembers: 99 }],
      errors: [{ messageId: 'complexUnionNewline' }],
    },
    {
      code: "type Alpha = Record<'a' | 'b', string>;",
      output: "type Alpha = Record<'a'\n  | 'b', string>;",
      options: [{ maxGenericMembers: 1 }],
      errors: [{ message: 'Union in generic type argument must split when more than 1 members.' }],
    },
  ],
});
