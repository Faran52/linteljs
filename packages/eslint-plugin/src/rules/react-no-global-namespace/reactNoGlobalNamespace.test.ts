import {
  jsRuleTester,
  tsRuleTester,
  tsxRuleTester,
} from '@mocks/ruleTesters';

import { reactNoGlobalNamespace } from './reactNoGlobalNamespace.ts';

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
  ],
  invalid: [
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
