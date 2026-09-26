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

    // `this` belongs to the function, so an arrow would rebind it.
    'function greet() {\n  return this.name;\n}',
    'const service = {\n  greet: function () {\n    return this.name;\n  }\n};',
    'class Service {\n  greet() {\n    return this.name;\n  }\n}',

    // `arguments`, `super` and `new.target` are not available in an arrow.
    'function greet() {\n  return arguments.length;\n}',

    // Shorthand `{ arguments }` reads the object, not a property, so it stays out of reach of the token check.
    'function grab() {\n  return { arguments };\n}',
    'function Greeter() {\n  if (!new.target) {\n    return 1;\n  }\n\n  return 2;\n}',
    'class Child extends Parent {\n  greet() {\n    return super.greet();\n  }\n}',

    // `this` inside a nested arrow belongs to the enclosing function; the stack walk passes through
    // the arrow frame and stops there.
    'function outer() {\n  const inner = () => {\n    return this.value;\n  };\n\n  return inner;\n}',

    // A class field arrow binds `this` to the instance, so a `this` inside it belongs there, not to
    // the enclosing function.
    'class Service {\n  handler = () => {\n    return this.value;\n  };\n}',

    // A destructured first parameter is not an identifier, so the `this` parameter check has to look past it.
    'function greet({ name }) {\n  return this.prefix + name;\n}',

    // A `const` cannot be constructed, reassigned, or carry a prototype, so a declaration used any
    // of those ways stays a declaration.
    'function Empty() {\n  return undefined;\n}\n\nconst made = new Empty();',
    'function Point(x) {\n  return x;\n}\n\nPoint.prototype.norm = 1;',
    'function replaceable() {\n  return 1;\n}\n\nreplaceable = other;',

    // An arrow drops the name, so a function expression that calls itself by name would lose the
    // binding it recurses through.
    'const fact = function inner(n) {\n  return n <= 1 ? 1 : n * inner(n - 1);\n};',

    'const tagged = (function () {\n  return 1;\n})`template`;',
    '!function () {\n  run();\n}();',
    'void function () {\n  run();\n}();',
    'const kind = typeof function () {\n  return 1;\n};',
    'const made = new function () {\n  return 1;\n}();',

    // An arrow with a block body cannot be immediately invoked, and the fix only rewrites the
    // function, so these stay unsafe.
    'const value = function () {\n  return 1;\n}();',
    'run(function () {\n  return 1;\n}());',
    'class Service {\n  value = function () {\n    return 1;\n  }();\n}',

    // Crockford's spelling wraps the call rather than the function, leaving the arrow bare in callee position.
    '(function (a) {\n  return a;\n}(1));',

    // A property whose function calls itself by name keeps the name, for the same reason a plain
    // function expression does.
    'const service = {\n  fact: function fact(n) {\n    return n <= 1 ? 1 : n * fact(n - 1);\n  }\n};',

    // `super` is only legal inside a method, so shorthand that reaches for it cannot become an arrow either.
    'const service = {\n  greet() {\n    return super.toString();\n  }\n};',

    // There is no `export default const`, so converting this means writing a statement of its own
    // and rewriting the export to name it. The anonymous form has no name to keep and does convert.
    'export default function greet() {\n  return 1;\n}',

    'const service = {\n  get value() {\n    return 1;\n  }\n};',
    'const service = {\n  set value(next) {\n    this.next = next;\n  }\n};',
    'const service = {\n  set value(next) {\n    store(next);\n  }\n};',

    // A sloppy-mode `function` may repeat a parameter name, which an arrow cannot in any mode;
    // `sourceType: 'script'` is required since a module would already reject this as a parse error.
    {
      code: 'function pick(first, _, _) {\n  return first;\n}',
      languageOptions: { sourceType: 'script' },
    },
    {
      code: 'const pick = function (alpha, bravo, alpha) {\n  return alpha;\n};',
      languageOptions: { sourceType: 'script' },
    },

    // Annex B: a sloppy-mode declaration may stand as an if or else body, or under a label, where a `const` may not.
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

    // A `var`-scoped name at the top level of a script may bind twice; a module binds lexically,
    // where this would already be a parse error.
    {
      code: 'function x(a) {\n  return a;\n}\n\nfunction x() {}',
      languageOptions: { sourceType: 'script' },
    },
    // The other binding need not be a function; no initialiser, since an assignment there is a
    // write the reassignment check already declines.
    {
      code: 'var x;\n\nfunction x() {}',
      languageOptions: { sourceType: 'script' },
    },

    // A StyleX dynamic style: its compiler refuses the block body the explicit-return fix would write.
    'const sheet = stylex.create({\n  box: (width) => ({ width }),\n});',
  ],
  invalid: [
    // Only `stylex.create` is compiled; the same shape anywhere else is an ordinary arrow.
    ...[
      'const sheet = { box: (width) => ({ width }) };',
      'const sheet = create({ box: (width) => ({ width }) });',
      'const sheet = this.create({ box: (width) => ({ width }) });',
      "const sheet = stylex['create']({ box: (width) => ({ width }) });",
      'const sheet = other.create({ box: (width) => ({ width }) });',
      'const sheet = stylex.keyframes({ box: (width) => ({ width }) });',
    ].map((code) => {
      return {
        code,
        output: code.replace('(width) => ({ width })', '(width) => { return { width } }'),
        errors: [{ messageId: 'preferExplicit' }],
      };
    }),
    {
      // `x` is declared twice, so it stays a function; the enclosing, singly bound `component` still converts.
      code: 'function component() {\n  function x(a) {\n    a.foo();\n  }\n\n  function x() {}\n\n  return x;\n}',
      output: 'const component = () => {\n  function x(a) {\n    a.foo();\n  }\n\n  function x() {}\n\n  return x;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // `new` alone is not `new.target`; matching only the keyword would wrongly decline every constructor call.
      code: 'function build() {\n  return new Service();\n}',
      output: 'const build = () => {\n  return new Service();\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // Same for `.target` reached off something that is not `new`.
      code: 'function read() {\n  return event.target;\n}',
      output: 'const read = () => {\n  return event.target;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // Parentheses around the function rather than around the call, so the arrow inherits them.
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
      // Not followed by the closing paren the callee check reads, so it is not mistaken for one.
      code: 'register(function () {\n  return 1;\n}, options);',
      output: 'register(() => {\n  return 1;\n}, options);',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // Same for an argument to `new`, which is not the thing constructed.
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
      // Parenthesised, so the parser reads this as an expression rather than the anonymous
      // declaration `export default function () {}` produces.
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
      // The class field's arrow anchors `this` to the instance, so the walk stops there and the
      // enclosing function is not marked as using `this`.
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
      // A plain callback owns its own `this`, so the walk stops there; treating every frame as an
      // arrow would wrongly mark `outer` too.
      code: 'function outer() {\n  return items.map(function () {\n    return this.value;\n  });\n}',
      output: 'const outer = () => {\n  return items.map(function () {\n    return this.value;\n  });\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // `helper` has already exited the stack by the time `read`'s `this` is walked, so a stale
      // frame there would wrongly stop `outer` from converting.
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
      // The binding is the member's property, not its object, so this says nothing about
      // `prototype` on the function itself.
      code: 'function prototype() {\n  return 1;\n}\n\nconst held = target[prototype];',
      output: 'const prototype = () => {\n  return 1;\n};\n\nconst held = target[prototype];',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // A `with` statement also carries an `object`, and it is not a member read, so there is no `prototype` here.
      code: 'function scope() {\n  return 1;\n}\n\nwith (scope) {}',
      output: 'const scope = () => {\n  return 1;\n};\n\nwith (scope) {}',
      languageOptions: { sourceType: 'script' },
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // A private name is not an Identifier, so `make.#prototype` reaches a field of that name
      // rather than the function's own prototype.
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
      // Long form with an irregular gap after the colon; replacing only the value avoids silently
      // reformatting a line nobody reported.
      code: 'const service = {\n  greet:  function () {\n    return 1;\n  }\n};',
      output: 'const service = {\n  greet:  () => {\n    return 1;\n  }\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // A comment between parameters has nowhere to go in the rebuilt arrow.
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
      // The binding is an argument to `new`, not the thing constructed.
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
      // Long-form property, so only the value is replaced, not the whole pair.
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
      // A destructured parameter is not an identifier, the branch the `this` parameter check falls through.
      code: 'function greet({ name }) {\n  return name;\n}',
      output: 'const greet = ({ name }) => {\n  return name;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // Two destructured params bind no identifier of their own, so the duplicate-name check must
      // not read them as two of the same.
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
      // A shorthand method's value does not include the key, so the whole property is replaced or
      // the output would not parse.
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
      // Still an arrow afterwards, so `this` resolves the same as before; the safety gate is only
      // about becoming an arrow.
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
      // `arguments` belongs to `outer` either way, so the inner arrow rewrites; `outer` itself must
      // not, since becoming an arrow would take `arguments` away.
      code: 'function outer() {\n  const count = () => arguments.length;\n\n  return count;\n}',
      output: 'function outer() {\n  const count = () => { return arguments.length };\n\n  return count;\n}',
      errors: [{ messageId: 'preferExplicit' }],
    },
    {
      // `node.arguments` is a property, not the `arguments` object; matching the token value alone
      // would wrongly decline it.
      code: 'function count(node) {\n  return node.arguments.length;\n}',
      output: 'const count = (node) => {\n  return node.arguments.length;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // Optional chaining puts `?.` in front of the property rather than `.`.
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
      // `outer` mentions `greet` above its declaration. Nothing here says when `outer` runs, so `greet`
      // declines; `outer` itself is mentioned nowhere earlier and converts.
      code: 'function outer() {\n  return greet();\n}\n\nfunction greet() {\n  return 1;\n}',
      output: 'const outer = () => {\n  return greet();\n};\n\nfunction greet() {\n  return 1;\n}',
      errors: [
        { messageId: 'preferArrow' },
        { messageId: 'preferArrowHoisted' },
      ],
    },
    {
      // The two-hop shape, and the reason the mention inside a function body counts: `run()` on line one
      // runs `helper()` immediately, so converting `helper` throws `ReferenceError` at load.
      code: 'run();\n\nfunction run() {\n  helper();\n}\n\nfunction helper() {\n  return 1;\n}',
      output: null,
      errors: [
        { messageId: 'preferArrowHoisted' },
        { messageId: 'preferArrowHoisted' },
      ],
    },
    {
      // The same two hops with `helper` declared first: its one mention sits below it, inside `run`, and `run`
      // is hoisted and called on line one, so the mention still runs before `helper` exists.
      code: 'run();\n\nfunction helper() {\n  return 1;\n}\n\nfunction run() {\n  helper();\n}',
      output: null,
      errors: [
        { messageId: 'preferArrowHoisted' },
        { messageId: 'preferArrowHoisted' },
      ],
    },
    {
      // Three hops, through a function that is itself only mentioned from inside another.
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
      // `run` is called only after `helper` is declared, so `helper` converts, and the mutual recursion does not
      // loop the walk. `run` is mentioned inside `helper`, above its own declaration, so it declines as before.
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
      // The anonymous default export holds the mention but has no name, so nothing in this module can call it
      // early, and it declares no variable at all for the walk to follow.
      code: 'function helper() {\n  return 1;\n}\n\nexport default function () {\n  return helper();\n}',
      output: 'const helper = () => {\n  return 1;\n};\n\nexport default () => {\n  return helper();\n};',
      errors: [
        { messageId: 'preferArrow' },
        { messageId: 'preferArrow' },
      ],
    },
    {
      // A later case of a switch can be jumped to without the earlier case running, so a `const` there is
      // still in its dead zone whatever the text order says.
      code: 'switch (key) {\n  case 0:\n    function helper() {\n      return 1;\n    }\n    break;\n'
        + '  case 1:\n    helper();\n}',
      output: null,
      errors: [{ messageId: 'preferArrowHoisted' }],
    },
    {
      // Referenced from the top level before the declaration, which does run first, so this one
      // stays a declaration and says why.
      code: 'const eager = greet();\n\nfunction greet() {\n  return 1;\n}',
      output: null,
      errors: [{ messageId: 'preferArrowHoisted' }],
    },
    {
      // Called above its declaration; a `const` would be in its temporal dead zone at that point.
      code: 'greet();\n\nfunction greet() {\n  return 1;\n}',
      output: null,
      errors: [{ messageId: 'preferArrowHoisted' }],
    },
    {
      // `forceHoisted` converts anyway; the output throws at runtime, exactly what the option warns about.
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
      // A function that uses `this` is not convertible at all, so hoisting never comes up for it.
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

    // A class field holding a `function` keeps its own dynamic `this`; an arrow would bind it to
    // the instance instead, a different program.
    'class Service {\n  handler = function (): number {\n    return 1;\n  };\n}',

    'function greet(this: Service): string {\n  return this.name;\n}',
    'function greet(this: Service, name: string): string {\n  return name;\n}',

    // An overload implementation stays a declaration; each signature is another definition of the
    // name, which the redeclaration check catches.
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
      // The statement before is an export, but not an overload signature, so it says nothing about this function.
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
      // A plain type predicate is not an assertion signature; only `asserts x is T` must stay a declaration.
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
      // A single type parameter in .tsx reads as a JSX tag, so the fix adds a trailing comma to disambiguate.
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
      // The source already carries a trailing comma, so the fix leaves the parameter list exactly
      // as written instead of adding a second one.
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
      // A trailing comma with a space after it still counts, so the parameter list stays exactly as written.
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
      // JSX text carries the word `arguments` as a token with no identifier type, so matching on
      // value alone would wrongly decline this.
      filename: 'component.tsx',
      code: 'function Comp() {\n  return <div>arguments</div>;\n}',
      output: 'const Comp = () => {\n  return <div>arguments</div>;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // And for `super`, which JSX text carries as a token of that value but not a keyword.
      filename: 'component.tsx',
      code: 'function Comp() {\n  return <div>super</div>;\n}',
      output: 'const Comp = () => {\n  return <div>super</div>;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
    {
      // Same for `new.target`: JSX spells `<new.target />` with three tokens of the same values
      // but none of the expected types.
      filename: 'component.tsx',
      code: 'function Comp() {\n  return <new.target />;\n}',
      output: 'const Comp = () => {\n  return <new.target />;\n};',
      errors: [{ messageId: 'preferArrow' }],
    },
  ],
});
