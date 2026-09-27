import { jsRuleTester } from '@mocks/ruleTesters';

import { noImportNamespaceDestructure } from './noImportNamespaceDestructure.ts';

jsRuleTester.run('no-import-namespace-destructure', noImportNamespaceDestructure, {
  valid: [
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

    'for (const { alpha } of items) {\n  use(alpha);\n}',

    'const { alpha } = unknownGlobal;',

    `import * as namespace from 'mod';
function run() {
  const namespace = {};
  const { alpha } = namespace;
  return alpha;
}`,
    "import * as namespace from 'mod';\nfunction run(namespace) {\n  const { alpha } = namespace;\n  return alpha;\n}",
    "import * as namespace from 'mod';\n{\n  let namespace = load();\n  const { alpha } = namespace;\n  use(alpha);\n}",

    "import * as namespace from 'mod';\nconst alias = namespace;\nconst { alpha } = alias;",

    'try { run(); } catch (error) { const { message } = error; use(message); }',
    'function factory() {}\nconst { alpha } = factory;',

    'class Thing {}\nconst { alpha } = Thing;',
    'for (const item of list) {\n  const { alpha } = item;\n  use(alpha);\n}',

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
