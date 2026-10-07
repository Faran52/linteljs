import { tsRuleTester } from '@mocks/ruleTesters';

import { noDuplicateInterface } from './noDuplicateInterfaceRule.ts';

tsRuleTester.run('no-duplicate-interface', noDuplicateInterface, {
  valid: [
    'interface Foo { a: string }\ninterface Bar { b: string }',

    // Each block is its own scope, and none is compared with the top level.
    'interface Window { a: string }\ndeclare global {\n  interface Window { b: string }\n}',
    "interface Foo { a: string }\ndeclare module 'x' {\n  interface Foo { b: string }\n}",
    'interface Foo { a: string }\nnamespace Ns {\n  interface Foo { b: string }\n}',
    'namespace A {\n  interface Foo { a: string }\n}\nnamespace B {\n  interface Foo { b: string }\n}',
    'interface Foo { a: string }\nfunction build() {\n  interface Foo { b: string }\n}',

    // Merges with something other than an interface are other rules' concern.
    'class Box {}\ninterface Box { a: string }',
    'namespace Ns { export const a = 1; }\ninterface Ns { b: string }',
    'function make() {}\ninterface make { a: string }',
    'const Kind = 1;\ntype Kind = number;',
    'type Foo = { a: string };\ninterface Bar { b: string }',

    // Two blocks are two scopes, even when TypeScript merges them.
    'declare global {\n  interface Window { a: string }\n}\ndeclare global {\n  interface Window { b: string }\n}',
    'function a() {\n  interface Foo { a: string }\n}\nfunction b() {\n  interface Foo { b: string }\n}',
    'namespace A.B {\n  interface Foo { a: string }\n}\ninterface Foo { b: string }',
    '{\n  interface Foo { a: string }\n}\ninterface Foo { b: string }',

    // The name is compared, not the generics or heritage.
    'interface Foo<T> { a: T }\ninterface FooBar<T> { b: T }',
  ],
  invalid: [
    {
      code: 'interface Foo { a: string }\ninterface Foo { b: string }',
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Foo' },
        line: 2,
        column: 11,
      }],
    },
    {
      code: 'export interface Foo { a: string }\ninterface Foo { b: string }',
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Foo' },
        line: 2,
      }],
    },
    {
      code: 'interface Foo { a: string }\nexport default interface Foo { b: string }',
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Foo' },
        line: 2,
      }],
    },
    {
      code: 'declare global {\n  interface Window { a: string }\n  interface Window { b: string }\n}',
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Window' },
        line: 3,
      }],
    },
    {
      code: "declare module 'x' {\n  export interface Foo { a: string }\n  export interface Foo { b: string }\n}",
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Foo' },
        line: 3,
      }],
    },
    {
      code: 'interface Foo { a: string }\ninterface Bar { b: string }\ninterface Foo { c: string }\n'
        + 'interface Foo { d: string }',
      errors: [
        {
          messageId: 'duplicateInterface',
          data: { name: 'Foo' },
          line: 3,
        },
        {
          messageId: 'duplicateInterface',
          data: { name: 'Foo' },
          line: 4,
        },
      ],
    },
    {
      code: 'function build() {\n  interface Foo { a: string }\n  interface Foo { b: string }\n}',
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Foo' },
        line: 3,
      }],
    },
    {
      code: 'const build = () => {\n  { interface Foo { a: string }\n  interface Foo { b: string } }\n};',
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Foo' },
        line: 3,
      }],
    },
    {
      code: 'namespace A.B {\n  export interface Foo { a: string }\n  interface Foo { b: string }\n}',
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Foo' },
        line: 3,
      }],
    },
    {
      code: 'declare interface Foo { a: string }\nexport declare interface Foo { b: string }',
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Foo' },
        line: 2,
        column: 26,
      }],
    },
    {
      code: 'interface Foo<T> extends Bar { a: T }\n/* again */ interface /* name */ Foo<T> { b: T }',
      errors: [{
        messageId: 'duplicateInterface',
        data: { name: 'Foo' },
        line: 2,
        column: 34,
      }],
    },
  ],
});
