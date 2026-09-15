import { jsRuleTester } from '@mocks/ruleTesters';

import { noImportNamespaceDestructure } from './index.ts';

jsRuleTester.run('no-import-namespace-destructure', noImportNamespaceDestructure, {
  valid: [
    // Reaching through the namespace is the behaviour this rule steers towards.
    "import * as namespace from 'mod';\nconst value = namespace.thing;",
    "import * as namespace from 'mod';\nnamespace.run();",

    "import { thing } from 'mod';\nconst { alpha } = thing;",
    "import thing from 'mod';\nconst { alpha } = thing;",

    'const source = {};\nconst { alpha } = source;',
    'const { alpha } = globalThis;',

    "import * as namespace from 'mod';\nconst { alpha } = namespace.nested;",
    "import * as namespace from 'mod';\nconst { alpha } = getThing();",

    "import * as namespace from 'mod';\nconst [alpha] = namespace;",
    "import * as namespace from 'mod';\nconst alias = namespace;",

    'let alpha;',

    // A `for...of` head is the one destructuring declarator with no initialiser, so it
    // needs a guard rather than an assumption.
    'for (const { alpha } of items) {\n  use(alpha);\n}',

    // An unresolved identifier has no definition to inspect.
    'const { alpha } = unknownGlobal;',

    // A local binding shadows the import, so the destructure is of the local object, not the
    // namespace; the scope walk must stop at the innermost match or this reports wrongly.
    `import * as namespace from 'mod';
function run() {
  const namespace = {};
  const { alpha } = namespace;
  return alpha;
}`,
    "import * as namespace from 'mod';\nfunction run(namespace) {\n  const { alpha } = namespace;\n  return alpha;\n}",
    "import * as namespace from 'mod';\n{\n  let namespace = load();\n  const { alpha } = namespace;\n  use(alpha);\n}",

    // A namespace re-exported through a plain variable is different: the definition this
    // rule inspects is the variable, not the import.
    "import * as namespace from 'mod';\nconst alias = namespace;\nconst { alpha } = alias;",

    'try { run(); } catch (error) { const { message } = error; use(message); }',
    'function factory() {}\nconst { alpha } = factory;',

    'class Thing {}\nconst { alpha } = Thing;',
    'for (const item of list) {\n  const { alpha } = item;\n  use(alpha);\n}',

    // A default beside a namespace, from one declaration: it is the binding's own definition
    // that decides, not whether the declaration carried a namespace specifier.
    "import defaultExport, * as namespace from 'mod';\nconst { alpha } = defaultExport;",
  ],
  invalid: [
    {
      code: "import * as namespace from 'mod';\nconst { alpha } = namespace;",
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: "import * as namespace from 'mod';\nconst { alpha, bravo } = namespace;",
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: "import * as namespace from 'mod';\nconst { alpha: renamed } = namespace;",
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: "import defaultExport, * as namespace from 'mod';\nconst { alpha } = namespace;",
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      // The destructure is inside a function, so resolving the namespace binding means
      // walking up, not just checking the declarator's own scope.
      code: "import * as namespace from 'mod';\nfunction run() {\n  const { alpha } = namespace;\n  return alpha;\n}",
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: `import * as namespace from 'mod';
const run = () => {
  const { alpha } = namespace;
  return alpha;
};`,
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: "import * as namespace from 'mod';\nif (condition) {\n  const { alpha } = namespace;\n  use(alpha);\n}",
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: `import * as namespace from 'mod';
function outer() {
  function inner() {
    const { alpha } = namespace;
    return alpha;
  }
  return inner;
}`,
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      // Shadowed in a sibling scope, so the inner reference still resolves to the import.
      code: `import * as namespace from 'mod';
function shadowed() {
  const namespace = {};
  return namespace;
}
function plain() {
  const { alpha } = namespace;
  return alpha;
}`,
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: `import * as namespace from 'mod';
class Thing {
  method() {
    const { alpha } = namespace;
    return alpha;
  }
}`,
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: "import * as namespace from 'mod';\nconst { alpha = fallback, ...rest } = namespace;",
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: `import * as namespace from 'mod';
for (const item of list) {
  const { alpha } = namespace;
  use(item, alpha);
}`,
      errors: [{ messageId: 'noDestructureNamespace' }],
    },
    {
      code: `import * as namespace from 'mod';
const { alpha } = namespace;
function run() {
  const { bravo } = namespace;
  return bravo;
}`,
      errors: [
        { messageId: 'noDestructureNamespace' },
        { messageId: 'noDestructureNamespace' },
      ],
    },
  ],
});
