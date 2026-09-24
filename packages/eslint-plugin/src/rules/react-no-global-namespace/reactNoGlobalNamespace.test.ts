import { reactNoGlobalNamespace } from './reactNoGlobalNamespace.ts';

import {
  jsRuleTester,
  svelteRuleTester,
  tsRuleTester,
  tsxRuleTester,
} from '#mocks/ruleTesters';

tsRuleTester.run('react-no-global-namespace: types', reactNoGlobalNamespace, {
  valid: [
    // The name is imported, which is the shape this rule steers towards.
    "import { type ReactNode } from 'react';\nlet value: ReactNode;",

    // A local `React` binding is a namespace the file owns, so reaching through it is not the global.
    "import React from 'react';\nlet value: React.ReactNode;",
    "import * as React from 'react';\nlet value: React.ReactNode;",

    // A namespace of some other name says nothing about React.
    'let value: NodeJS.Timeout;',

    // Shadowing counts, which is why the scope walk goes up rather than reading one scope.
    `import React from 'react';
function build() {
  let value: React.ReactNode;
  return value;
}`,

    /**
     * A declaration file is a script until something imports into it. An import would make it a module, at
     * which point `declare module '*.svg'` augments a module that does not exist and every global here stops
     * being global. There is nothing to report either: the file cannot take the import the message asks for.
     */
    {
      code: "declare module '*.svg' {\n  const Component: React.FC;\n  export default Component;\n}",
      filename: 'custom.d.ts',
    },

    // The same shape with no extension to go on: a top-level `declare` and not one import in the file.
    {
      code: 'declare global {\n  interface Window { root: React.ReactNode }\n}',
      filename: 'globals.ts',
    },

    // And the other way round: the extension alone, with no `declare` to go on, in each of its three spellings.
    ...['props.d.ts', 'props.d.cts', 'props.d.mts'].map((filename) => {
      return {
        code: 'interface Props { children: React.ReactNode }',
        filename,
      };
    }),

    // One `declare` makes the file a script whatever sits beside it, so a plain statement does not undo it.
    {
      code: 'declare const root: HTMLElement;\nconst value: React.ReactNode = null;',
      filename: 'globals.ts',
    },
  ],
  invalid: [
    {
      // Only a name ending in the extension is a declaration file.
      code: 'interface Props { children: React.ReactNode }',
      filename: 'props.d.tsx',
      output: "import { type ReactNode } from 'react';\n\ninterface Props { children: ReactNode }",
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: 'let value: React.ReactNode;',
      output: "import { type ReactNode } from 'react';\n\nlet value: ReactNode;",
      errors: [{
        messageId: 'globalNamespace',
        data: { name: 'ReactNode' },
      }],
    },

    /**
     * Imports present but none from `react`, which is the shape every starter file has. The insert goes before the
     * first statement; a fix that only rewrote the member would leave `ReactNode` bound to nothing.
     */
    {
      code: "import { render } from 'x';\n\ninterface Props { children?: React.ReactNode }",
      output: "import { type ReactNode } from 'react';\n\nimport { render } from 'x';\n\n"
        + 'interface Props { children?: ReactNode }',
      errors: [{ messageId: 'globalNamespace' }],
    },

    // An existing `react` import is merged into rather than duplicated.
    {
      code: "import { useState } from 'react';\nlet value: React.ReactNode;",
      output: "import { type ReactNode, useState } from 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    /**
     * `'use client'` is a directive only while nothing precedes it. The insert used to go before the first
     * statement, which put the import above the directive and left Next's compiler refusing the file.
     */
    {
      code: "'use client';\n\ninterface Props { children?: React.ReactNode }",
      output: "'use client';\n\nimport { type ReactNode } from 'react';\n\ninterface Props { children?: ReactNode }",
      errors: [{ messageId: 'globalNamespace' }],
    },

    /**
     * Only a string literal opening the file is a directive. typescript-eslint gives every ExpressionStatement a
     * `directive` key, and reading the key alone skipped `run();` as if it were one: the import landed after it,
     * and a file of nothing but expression statements found no statement at all and threw.
     */
    {
      code: 'run();\nconst element: React.ReactNode = 1;',
      output: "import { type ReactNode } from 'react';\n\nrun();\nconst element: ReactNode = 1;",
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: "React.createElement('div');",
      output: "import { createElement } from 'react';\n\ncreateElement('div');",
      errors: [{ messageId: 'globalNamespace' }],
    },

    // A `declare` beside an import is already a module, so another import changes nothing about the file.
    {
      code: "import { render } from 'x';\n\ndeclare const value: React.ReactNode;",
      output: "import { type ReactNode } from 'react';\n\nimport { render } from 'x';\n\n"
        + 'declare const value: ReactNode;',
      errors: [{ messageId: 'globalNamespace' }],
    },

    /**
     * Every import shape that carries no named list to join. A second `import { ... } from 'react'` beside one of
     * these is valid; rewriting them into one is not, and doing that by string surgery on the statement produced
     * `import * as R, { type ReactNode } from 'react'` and `import type { type ReactNode, FC }`, neither of which
     * parses. Each of these is a fix that shipped broken once.
     */
    {
      code: "import Other from 'react';\nlet value: React.ReactNode;",
      output: "import { type ReactNode } from 'react';\n\nimport Other from 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: "import type { FC } from 'react';\nlet value: React.ReactNode;",
      output: "import { type ReactNode } from 'react';\n\nimport type { FC } from 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: "import * as Other from 'react';\nlet value: React.ReactNode;",
      output: "import { type ReactNode } from 'react';\n\nimport * as Other from 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: "import 'react';\nlet value: React.ReactNode;",
      output: "import { type ReactNode } from 'react';\n\nimport 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    // A default beside a named list still has the list, so the fix joins it rather than writing a second statement.
    {
      code: "import Other, { useState } from 'react';\nlet value: React.ReactNode;",
      output: "import Other, { type ReactNode, useState } from 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    // Double quotes, because the merge used to rebuild the statement and had to guess the style.
    {
      code: 'import { useState } from "react";\nlet value: React.ReactNode;',
      output: 'import { type ReactNode, useState } from "react";\nlet value: ReactNode;',
      errors: [{ messageId: 'globalNamespace' }],
    },

    // `React.JSX.Element` reports on the inner qualified name, which is the one reaching the global.
    {
      code: 'let value: React.JSX.Element;',
      output: "import { type JSX } from 'react';\n\nlet value: JSX.Element;",
      errors: [{
        messageId: 'globalNamespace',
        data: { name: 'JSX' },
      }],
    },

    /**
     * Two sites and no import. `RuleTester` applies one pass, so only the first is rewritten here; a real `--fix`
     * loops and the second joins the list the first left behind, which `verifyAndFix` was used to confirm.
     */
    {
      code: 'let a: React.ReactNode;\nlet b: React.ReactElement;',
      output: "import { type ReactNode } from 'react';\n\nlet a: ReactNode;\nlet b: React.ReactElement;",
      errors: [{ messageId: 'globalNamespace' }, { messageId: 'globalNamespace' }],
    },

    // Already imported under that name, so only the member access changes.
    {
      code: "import { type ReactNode } from 'react';\nlet value: React.ReactNode;",
      output: "import { type ReactNode } from 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    /**
     * `ReactNode` is bound to something else here, so rewriting the member access would quietly mean that other
     * thing. Reported with no fix rather than guessing.
     */
    {
      code: 'interface ReactNode { own: true }\nlet value: React.ReactNode;',
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },
  ],
});

tsxRuleTester.run('react-no-global-namespace: markup', reactNoGlobalNamespace, {
  valid: [
    "import React from 'react';\nconst el = <React.Fragment />;",
    'const el = <div />;',
    'const el = <Other.Thing />;',

    // A deeper member has no name of its own on the object, so nothing claims it reaches the global.
    'const el = <React.JSX.Foo />;',
  ],
  invalid: [
    {
      code: 'const el = <React.Fragment />;',
      output: "import { Fragment } from 'react';\n\nconst el = <Fragment />;",
      errors: [{
        messageId: 'globalNamespace',
        data: { name: 'Fragment' },
      }],
    },

    /**
     * Both tags in one fix. A pass that rewrote the opening tag alone would leave `<Fragment>` against
     * `</React.Fragment>`, which does not parse, and ESLint writes whatever the last pass produced.
     */
    {
      code: 'const el = <React.Fragment>text</React.Fragment>;',
      output: "import { Fragment } from 'react';\n\nconst el = <Fragment>text</Fragment>;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    // A value, so the specifier carries no `type`, and it joins the list already there.
    {
      code: "import { useState } from 'react';\nconst el = <React.Fragment>t</React.Fragment>;",
      output: "import { Fragment, useState } from 'react';\nconst el = <Fragment>t</Fragment>;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    /**
     * The name is imported, but as a type, so `<Fragment>` against it is a value TypeScript refuses. Reading
     * the name alone counted that as already imported and rewrote both tags. The name is taken either way,
     * which leaves nothing to write: reported with no fix.
     */
    {
      code: "import type { Fragment } from 'react';\nconst el = <React.Fragment />;",
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },

    // The same binding under the inline spelling, where `importKind` sits on the specifier instead.
    {
      code: "import { type Fragment } from 'react';\nconst el = <React.Fragment />;",
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },

    // A value specifier of that name is what a value reach needs, so only the tag changes.
    {
      code: "import { Fragment } from 'react';\nconst el = <React.Fragment />;",
      output: "import { Fragment } from 'react';\nconst el = <Fragment />;",
      errors: [{ messageId: 'globalNamespace' }],
    },
  ],
});

jsRuleTester.run('react-no-global-namespace: values', reactNoGlobalNamespace, {
  valid: [
    "import { createElement } from 'react';\ncreateElement('div');",
    "import React from 'react';\nReact.createElement('div');",

    // A computed access names nothing a fix could import.
    "const key = 'createElement';\nReact[key]('div');",

    'other.createElement();',
  ],
  invalid: [
    {
      code: "React.createElement('div');",
      output: "import { createElement } from 'react';\n\ncreateElement('div');",
      errors: [{
        messageId: 'globalNamespace',
        data: { name: 'createElement' },
      }],
    },

    // A value merges without `type`, unlike the type position above.
    {
      code: "import { useState } from 'react';\nReact.createElement('div');",
      output: "import { createElement, useState } from 'react';\ncreateElement('div');",
      errors: [{ messageId: 'globalNamespace' }],
    },
  ],
});

/**
 * svelte-eslint-parser puts each `<script>` in `Program.body` as an element. The import once went before the first
 * of those, which is above the `<script>` tag: markup text, parseable, and a component that no longer imports what
 * it calls. Now it goes inside the script that holds the reference, and a reference in the template, where no import
 * can go, is reported with no fix.
 */
svelteRuleTester.run('react-no-global-namespace: svelte', reactNoGlobalNamespace, {
  valid: [],
  invalid: [
    {
      code: '<script lang="ts">\n  const state = React.useState(0);\n</script>\n\n<p>{state}</p>\n',
      filename: 'Probe.svelte',
      output: '<script lang="ts">\n  import { useState } from \'react\';\n\n  const state = useState(0);\n</script>\n\n'
        + '<p>{state}</p>\n',
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: '<script lang="ts">\n  const label = 1;\n</script>\n\n<p>{React.version} {label}</p>\n',
      filename: 'Probe.svelte',
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },
  ],
});
