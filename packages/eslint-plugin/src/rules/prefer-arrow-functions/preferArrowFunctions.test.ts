import {
  jsRuleTester,
  tsRuleTester,
  tsxRuleTester,
} from '@mocks/ruleTesters';

import { preferArrowFunctions } from './preferArrowFunctions.ts';

jsRuleTester.run('prefer-arrow-functions', preferArrowFunctions, {
  valid: [
    'const greet = () => {\n  return 1;\n};',
    'const greet = (name) => {\n  return name;\n};',

    'function* walk() {\n  yield 1;\n}',
    'const walker = {\n  * walk() {\n    yield 1;\n  }\n};',

    'function greet() {\n  return this.name;\n}',
    'const service = {\n  greet: function () {\n    return this.name;\n  }\n};',
    'class Service {\n  greet() {\n    return this.name;\n  }\n}',

    'function greet() {\n  return arguments.length;\n}',

    'function grab() {\n  return { arguments };\n}',
    'function Greeter() {\n  if (!new.target) {\n    return 1;\n  }\n\n  return 2;\n}',
    'class Child extends Parent {\n  greet() {\n    return super.greet();\n  }\n}',

    'function outer() {\n  const inner = () => {\n    return this.value;\n  };\n\n  return inner;\n}',

    'class Service {\n  handler = () => {\n    return this.value;\n  };\n}',

    'function greet({ name }) {\n  return this.prefix + name;\n}',

    'function Empty() {\n  return undefined;\n}\n\nconst made = new Empty();',
    'function Point(x) {\n  return x;\n}\n\nPoint.prototype.norm = 1;',
    'function replaceable() {\n  return 1;\n}\n\nreplaceable = other;',

    'const fact = function inner(n) {\n  return n <= 1 ? 1 : n * inner(n - 1);\n};',

    'const tagged = (function () {\n  return 1;\n})`template`;',
    '!function () {\n  run();\n}();',
    'void function () {\n  run();\n}();',
    'const kind = typeof function () {\n  return 1;\n};',
    'const made = new function () {\n  return 1;\n}();',

    'const value = function () {\n  return 1;\n}();',
    'run(function () {\n  return 1;\n}());',
    'class Service {\n  value = function () {\n    return 1;\n  }();\n}',

    '(function (a) {\n  return a;\n}(1));',

    'const service = {\n  fact: function fact(n) {\n    return n <= 1 ? 1 : n * fact(n - 1);\n  }\n};',

    'const service = {\n  greet() {\n    return super.toString();\n  }\n};',

    'export default function greet() {\n  return 1;\n}',

    'const service = {\n  get value() {\n    return 1;\n  }\n};',
    'const service = {\n  set value(next) {\n    this.next = next;\n  }\n};',
    'const service = {\n  set value(next) {\n    store(next);\n  }\n};',

    {
      code: 'function pick(first, _, _) {\n  return first;\n}',
      languageOptions: { sourceType: 'script' },
    },
    {
      code: 'const pick = function (alpha, bravo, alpha) {\n  return alpha;\n};',
      languageOptions: { sourceType: 'script' },
    },

    {
      code: 'if (flag) function helper() {\n  return 1;\n}',
      languageOptions: { sourceType: 'script' },
    },
    {
      code: 'if (flag) run();\nelse function helper() {\n  return 1;\n}',
      languageOptions: { sourceType: 'script' },
    },
    {
      code: 'outer: function helper() {\n  return 1;\n}',
      languageOptions: { sourceType: 'script' },
    },

    {
      code: 'function x(a) {\n  return a;\n}\n\nfunction x() {}',
      languageOptions: { sourceType: 'script' },
    },
    {
      code: 'var x;\n\nfunction x() {}',
      languageOptions: { sourceType: 'script' },
    },

    'const sheet = stylex.create({\n  box: (width) => ({ width }),\n});',
  ],
  invalid: [
    ...[
      'const sheet = { box: (width) => ({ width }) };',
      'const sheet = create({ box: (width) => ({ width }) });',
      'const sheet = this.create({ box: (width) => ({ width }) });',
      "const sheet = stylex['create']({ box: (width) => ({ width }) });",
      'const sheet = other.create({ box: (width) => ({ width }) });',
      'const sheet = stylex.keyframes({ box: (width) => ({ width }) });',
      '(width) => ({ width });',
    ]
      .map((code) => {
        return {
          code,
          output: code.replace('(width) => ({ width })', '(width) => { return { width } }'),
          errors: [{ messageId: 'preferExplicit' }],
        };
      }),
    {
      code: 'function component() {\n  function x(a) {\n    a.foo();\n  }\n\n  function x() {}\n\n  return x;\n}',
      output: 'const component = () => {\n  function x(a) {\n    a.foo();\n  }\n\n  function x() {}\n\n  return x;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'items.forEach(function (a) {\n  a.forEach(function (b) {\n    run(b);\n  });\n});',
      output: 'items.forEach((a) => {\n  a.forEach((b) => {\n    run(b);\n  });\n});',
      errors: [{ messageId: 'preferArrow' }, { messageId: 'preferArrow' }],
    },
    {
      code: 'function build() {\n  return new Service();\n}',
      output: 'const build = () => {\n  return new Service();\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function read() {\n  return event.target;\n}',
      output: 'const read = () => {\n  return event.target;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: '(function (a) {\n  return a;\n})(1);',
      output: '((a) => {\n  return a;\n})(1);',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'register(function () {\n  return 1;\n});',
      output: 'register(() => {\n  return 1;\n});',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'register(function () {\n  return 1;\n}, options);',
      output: 'register(() => {\n  return 1;\n}, options);',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const made = new Service(function () {\n  return 1;\n});',
      output: 'const made = new Service(() => {\n  return 1;\n});',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const handlers = [function () {\n  return 1;\n}];',
      output: 'const handlers = [() => {\n  return 1;\n}];',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'handler = function () {\n  return 1;\n};',
      output: 'handler = () => {\n  return 1;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'export default (function () {\n  return 1;\n});',
      output: 'export default (() => {\n  return 1;\n});',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: '(function () {\n  run();\n});',
      output: '(() => {\n  run();\n});',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const make = () => {\n  return function () {\n    return 1;\n  };\n};',
      output: 'const make = () => {\n  return () => {\n    return 1;\n  };\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const values = [...function () {\n  return [];\n}];',
      output: 'const values = [...() => {\n  return [];\n}];',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: `function outer() {
  class Service {
    handler = () => {
      return this.value;
    };
  }

  return Service;
}`,
      output: `const outer = () => {
  class Service {
    handler = () => {
      return this.value;
    };
  }

  return Service;
};`,
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function outer() {\n  return items.map(function () {\n    return this.value;\n  });\n}',
      output: 'const outer = () => {\n  return items.map(function () {\n    return this.value;\n  });\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: `function outer() {
  function helper() {
    return 1;
  }

  const read = () => {
    return this.value;
  };

  return [helper, read];
}`,
      output: `function outer() {
  const helper = () => {
    return 1;
  };

  const read = () => {
    return this.value;
  };

  return [helper, read];
}`,
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function prototype() {\n  return 1;\n}\n\nconst held = target[prototype];',
      output: 'const prototype = () => {\n  return 1;\n};\n\nconst held = target[prototype];',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function scope() {\n  return 1;\n}\n\nwith (scope) {}',
      output: 'const scope = () => {\n  return 1;\n};\n\nwith (scope) {}',
      languageOptions: { sourceType: 'script' },
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: `function make() {
  return 1;
}

class Holder {
  #prototype = 1;

  read() {
    return make.#prototype;
  }
}`,
      output: `const make = () => {
  return 1;
};

class Holder {
  #prototype = 1;

  read() {
    return make.#prototype;
  }
}`,
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const service = {\n  greet:  function () {\n    return 1;\n  }\n};',
      output: 'const service = {\n  greet:  () => {\n    return 1;\n  }\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const run = function (alpha /* first */, bravo) {\n  return alpha;\n};',
      output: null,
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const run = function helper(value) {\n  return value;\n};',
      output: 'const run = (value) => {\n  return value;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function greet(that, other) {\n  return that + other;\n}',
      output: 'const greet = (that, other) => {\n  return that + other;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function make() {\n  return 1;\n}\n\nconst held = new Wrapper(make);',
      output: 'const make = () => {\n  return 1;\n};\n\nconst held = new Wrapper(make);',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function make() {\n  return 1;\n}\n\nmake.displayName = \'x\';',
      output: 'const make = () => {\n  return 1;\n};\n\nmake.displayName = \'x\';',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const service = {\n  greet: function (name) {\n    return name;\n  }\n};',
      output: 'const service = {\n  greet: (name) => {\n    return name;\n  }\n};',
      errors: [{ messageId: 'preferArrow' }],
    },

    {
      code: 'function greet() {\n  return 1;\n}',
      output: 'const greet = () => {\n  return 1;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function greet({ name }) {\n  return name;\n}',
      output: 'const greet = ({ name }) => {\n  return name;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function pair({ alpha }, [bravo]) {\n  return alpha + bravo;\n}',
      output: 'const pair = ({ alpha }, [bravo]) => {\n  return alpha + bravo;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function greet(name) {\n  return name;\n}',
      output: 'const greet = (name) => {\n  return name;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'async function load() {\n  return 1;\n}',
      output: 'const load = async () => {\n  return 1;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function greet() {\n  return 1;\n}\n\ngreet();',
      output: 'const greet = () => {\n  return 1;\n};\n\ngreet();',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const service = {\n  greet: function () {\n    return 1;\n  }\n};',
      output: 'const service = {\n  greet: () => {\n    return 1;\n  }\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const service = {\n  greet() {\n    return 1;\n  }\n};',
      output: 'const service = {\n  greet: () => {\n    return 1;\n  }\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const service = {\n  [key]() {\n    return 1;\n  }\n};',
      output: 'const service = {\n  [key]: () => {\n    return 1;\n  }\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const run = function () {\n  return 1;\n};',
      output: 'const run = () => {\n  return 1;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'export default function () {\n  return 1;\n}',
      output: 'export default () => {\n  return 1;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'const greet = () => 1;',
      output: 'const greet = () => { return 1 };',
      errors: [{ messageId: 'preferExplicit' }],
    },
    {
      code: 'const read = () => this.value;',
      output: 'const read = () => { return this.value };',
      errors: [{ messageId: 'preferExplicit' }],
    },
    {
      code: 'class Service {\n  handler = () => this.value;\n}',
      output: 'class Service {\n  handler = () => { return this.value };\n}',
      errors: [{ messageId: 'preferExplicit' }],
    },
    {
      code: 'function outer() {\n  const count = () => arguments.length;\n\n  return count;\n}',
      output: 'function outer() {\n  const count = () => { return arguments.length };\n\n  return count;\n}',
      errors: [{ messageId: 'preferExplicit' }],
    },
    {
      code: 'function count(node) {\n  return node.arguments.length;\n}',
      output: 'const count = (node) => {\n  return node.arguments.length;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function count(node) {\n  return node?.arguments.length;\n}',
      output: 'const count = (node) => {\n  return node?.arguments.length;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'export function greet() {\n  return 1;\n}',
      output: 'export const greet = () => {\n  return 1;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function outer() {\n  return greet();\n}\n\nfunction greet() {\n  return 1;\n}',
      output: 'const outer = () => {\n  return greet();\n};\n\nfunction greet() {\n  return 1;\n}',
      errors: [
        { messageId: 'preferArrow' },
        { messageId: 'preferArrowHoisted' },
      ],
    },
    {
      code: 'run();\n\nfunction run() {\n  helper();\n}\n\nfunction helper() {\n  return 1;\n}',
      output: null,
      errors: [
        { messageId: 'preferArrowHoisted' },
        { messageId: 'preferArrowHoisted' },
      ],
    },
    {
      code: 'run();\n\nfunction helper() {\n  return 1;\n}\n\nfunction run() {\n  helper();\n}',
      output: null,
      errors: [
        { messageId: 'preferArrowHoisted' },
        { messageId: 'preferArrowHoisted' },
      ],
    },
    {
      code: 'start();\n\nfunction helper() {\n  return 1;\n}\n\nfunction run() {\n  helper();\n}\n\n'
        + 'function start() {\n  run();\n}',
      output: null,
      errors: [
        { messageId: 'preferArrowHoisted' },
        { messageId: 'preferArrowHoisted' },
        { messageId: 'preferArrowHoisted' },
      ],
    },
    {
      code: 'function helper(n) {\n  return n && run(n - 1);\n}\n\nfunction run(n) {\n  return helper(n);\n}\n\n'
        + 'run(2);',
      output: 'const helper = (n) => {\n  return n && run(n - 1);\n};\n\nfunction run(n) {\n  return helper(n);\n}\n\n'
        + 'run(2);',
      errors: [
        { messageId: 'preferArrow' },
        { messageId: 'preferArrowHoisted' },
      ],
    },
    {
      code: 'function helper() {\n  return 1;\n}\n\nexport default function () {\n  return helper();\n}',
      output: 'const helper = () => {\n  return 1;\n};\n\nexport default () => {\n  return helper();\n};',
      errors: [
        { messageId: 'preferArrow' },
        { messageId: 'preferArrow' },
      ],
    },
    {
      code: 'switch (key) {\n  case 0:\n    function helper() {\n      return 1;\n    }\n    break;\n'
        + '  case 1:\n    helper();\n}',
      output: null,
      errors: [{ messageId: 'preferArrowHoisted' }],
    },
    {
      code: 'switch (key) {\n  case 0:\n    function helper() {\n      return 1;\n    }\n    handler = helper\n}',
      output: 'switch (key) {\n  case 0:\n    const helper = () => {\n      return 1;\n    };\n    handler = helper\n}',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'export function greet() {\n  return 1;\n}\n\ngreet();',
      output: 'export const greet = () => {\n  return 1;\n};\n\ngreet();',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function helper() {\n  return 1;\n}\n\nfunction run() {\n  return helper();\n}',
      output: 'const helper = () => {\n  return 1;\n};\n\nconst run = () => {\n  return helper();\n};',
      errors: [
        { messageId: 'preferArrow' },
        { messageId: 'preferArrow' },
      ],
    },
    {
      code: 'function helper() {\n  return 1;\n}\n\nfunction run(n) {\n  return helper() + loop(n);\n}\n\n'
        + 'function loop(n) {\n  return n && run(n - 1);\n}',
      output: 'const helper = () => {\n  return 1;\n};\n\nconst run = (n) => {\n  return helper() + loop(n);\n};\n\n'
        + 'function loop(n) {\n  return n && run(n - 1);\n}',
      errors: [
        { messageId: 'preferArrow' },
        { messageId: 'preferArrow' },
        { messageId: 'preferArrowHoisted' },
      ],
    },
    {
      code: 'const eager = greet();\n\nfunction greet() {\n  return 1;\n}',
      output: null,
      errors: [{ messageId: 'preferArrowHoisted' }],
    },
    {
      code: 'greet();\n\nfunction greet() {\n  return 1;\n}',
      output: null,
      errors: [{ messageId: 'preferArrowHoisted' }],
    },
    {
      code: 'greet();\n\nfunction greet() {\n  return 1;\n}',
      output: 'greet();\n\nconst greet = () => {\n  return 1;\n};',
      options: [{ forceHoisted: true }],
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function greet() {\n  return 1;\n}\n\ngreet();',
      output: 'const greet = () => {\n  return 1;\n};\n\ngreet();',
      options: [{ forceHoisted: true }],
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'export { greet };\n\nfunction greet() {\n  return 1;\n}',
      output: null,
      errors: [{ messageId: 'preferArrowHoisted' }],
    },
    {
      code: 'if (ready) {\n  greet();\n}\n\nfunction greet() {\n  return 1;\n}',
      output: null,
      errors: [{ messageId: 'preferArrowHoisted' }],
    },
    {
      code: 'helper();\n\nfunction helper() {\n  return this.value;\n}\n\nfunction other() {\n  return 1;\n}',
      output: 'helper();\n\nfunction helper() {\n  return this.value;\n}\n\nconst other = () => {\n  return 1;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
  ],
});

tsRuleTester.run('prefer-arrow-functions (typescript)', preferArrowFunctions, {
  valid: [
    'const fn = function (): number {\n  return 1;\n} as () => number;',
    'const fn = function (): number {\n  return 1;\n} satisfies () => number;',
    'const fn = (function (): number {\n  return 1;\n})!;',
    'const load = async () => {\n  return await function () {\n    return 1;\n  };\n};',

    `function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('no');
  }
}`,

    'class Service {\n  handler = function (): number {\n    return 1;\n  };\n}',

    'function greet(this: Service): string {\n  return this.name;\n}',
    'function greet(this: Service, name: string): string {\n  return name;\n}',

    `function greet(value: string): string;
function greet(value: number): number;
function greet(value: unknown): unknown {
  return value;
}`,
    `export function greet(value: string): string;
export function greet(value: number): number;
export function greet(value: unknown): unknown {
  return value;
}`,
  ],
  invalid: [
    {
      code: 'export const version = 1;\nfunction greet(name: string): string {\n  return name;\n}',
      output: 'export const version = 1;\nconst greet = (name: string): string => {\n  return name;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function greet(name: string): string {\n  return name;\n}',
      output: 'const greet = (name: string): string => {\n  return name;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function identity<T>(value: T): T {\n  return value;\n}',
      output: 'const identity = <T>(value: T): T => {\n  return value;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'function isText(value: unknown): value is string {\n  return typeof value === \'string\';\n}',
      output: 'const isText = (value: unknown): value is string => {\n  return typeof value === \'string\';\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      code: 'async function load(url: string): Promise<string> {\n  return url;\n}',
      output: 'const load = async (url: string): Promise<string> => {\n  return url;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
  ],
});

tsxRuleTester.run('prefer-arrow-functions (tsx)', preferArrowFunctions, {
  valid: [
    {
      filename: 'component.tsx',
      code: 'const identity = <T,>(value: T): T => {\n  return value;\n};',
    },
  ],
  invalid: [
    {
      filename: 'component.tsx',
      code: 'function identity<T>(value: T): T {\n  return value;\n}',
      output: 'const identity = <T,>(value: T): T => {\n  return value;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      filename: 'component.tsx',
      code: 'function identity<T extends string>(value: T): T {\n  return value;\n}',
      output: 'const identity = <T extends string,>(value: T): T => {\n  return value;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      filename: 'component.tsx',
      code: 'function identity<T,>(value: T): T {\n  return value;\n}',
      output: 'const identity = <T,>(value: T): T => {\n  return value;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      filename: 'component.tsx',
      code: 'function pair<A, B>(first: A, second: B): [A, B] {\n  return [first, second];\n}',
      output: 'const pair = <A, B>(first: A, second: B): [A, B] => {\n  return [first, second];\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      filename: 'component.tsx',
      code: 'function identity<T, >(value: T): T {\n  return value;\n}',
      output: 'const identity = <T, >(value: T): T => {\n  return value;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      filename: 'component.tsx',
      code: 'const view = <Panel render={function () {\n  return 1;\n}} />;',
      output: 'const view = <Panel render={() => {\n  return 1;\n}} />;',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      filename: 'component.tsx',
      code: 'function Comp() {\n  return <div>arguments</div>;\n}',
      output: 'const Comp = () => {\n  return <div>arguments</div>;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      filename: 'component.tsx',
      code: 'function Comp() {\n  return <div>super</div>;\n}',
      output: 'const Comp = () => {\n  return <div>super</div>;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      filename: 'component.tsx',
      code: 'function Comp() {\n  return <new.target />;\n}',
      output: 'const Comp = () => {\n  return <new.target />;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
  ],
});
