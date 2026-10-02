import {
  jsRuleTester,
  svelteRuleTester,
  tsRuleTester,
  tsxRuleTester,
} from '@mocks/ruleTesters';

import { reactNoGlobalNamespace } from './reactNoGlobalNamespace.ts';

tsRuleTester.run('react-no-global-namespace: types', reactNoGlobalNamespace, {
  valid: [
    "import { type ReactNode } from 'react';\nlet value: ReactNode;",

    "import React from 'react';\nlet value: React.ReactNode;",
    "import * as React from 'react';\nlet value: React.ReactNode;",

    'let value: NodeJS.Timeout;',

    `import React from 'react';
function build() {
  let value: React.ReactNode;
  return value;
}`,

    {
      code: "declare module '*.svg' {\n  const Component: React.FC;\n  export default Component;\n}",
      filename: 'custom.d.ts',
    },

    {
      code: 'declare global {\n  interface Window { root: React.ReactNode }\n}',
      filename: 'globals.ts',
    },

    ...[
      'props.d.ts',
      'props.d.cts',
      'props.d.mts',
    ]
      .map((filename) => {
        const testCase = {
          code: 'interface Props { children: React.ReactNode }',
          filename,
        };

        return testCase;
      }),

    {
      code: 'declare const root: HTMLElement;\nconst value: React.ReactNode = null;',
      filename: 'globals.ts',
    },
  ],
  invalid: [
    {
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

    {
      code: "import { render } from 'x';\n\ninterface Props { children?: React.ReactNode }",
      output: "import { type ReactNode } from 'react';\n\nimport { render } from 'x';\n\n"
        + 'interface Props { children?: ReactNode }',
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: "import { useState } from 'react';\nlet value: React.ReactNode;",
      output: "import { type ReactNode, useState } from 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: "'use client';\n\ninterface Props { children?: React.ReactNode }",
      output: "'use client';\n\nimport { type ReactNode } from 'react';\n\ninterface Props { children?: ReactNode }",
      errors: [{ messageId: 'globalNamespace' }],
    },

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

    {
      code: "import { render } from 'x';\n\ndeclare const value: React.ReactNode;",
      output: "import { type ReactNode } from 'react';\n\nimport { render } from 'x';\n\n"
        + 'declare const value: ReactNode;',
      errors: [{ messageId: 'globalNamespace' }],
    },

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

    {
      code: "import Other, { useState } from 'react';\nlet value: React.ReactNode;",
      output: "import Other, { type ReactNode, useState } from 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: 'import { useState } from "react";\nlet value: React.ReactNode;',
      output: 'import { type ReactNode, useState } from "react";\nlet value: ReactNode;',
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: 'let value: React.JSX.Element;',
      output: "import { type JSX } from 'react';\n\nlet value: JSX.Element;",
      errors: [{
        messageId: 'globalNamespace',
        data: { name: 'JSX' },
      }],
    },

    {
      code: 'let a: React.ReactNode;\nlet b: React.ReactElement;',
      output: "import { type ReactNode, type ReactElement } from 'react';\n\nlet a: ReactNode;\nlet b: ReactElement;",
      errors: [{ messageId: 'globalNamespace' }, { messageId: 'globalNamespace' }],
    },

    {
      code: 'let a: React.ReactNode;\nconst b = React.useState;\nconst c = React.useState;',
      output: "import { type ReactNode, useState } from 'react';\n\n"
        + 'let a: ReactNode;\nconst b = useState;\nconst c = useState;',
      errors: [
        { messageId: 'globalNamespace' },
        { messageId: 'globalNamespace' },
        { messageId: 'globalNamespace' },
      ],
    },

    {
      code: 'let a: React.Component;\nclass B extends React.Component {}',
      output: "import { Component } from 'react';\n\nlet a: Component;\nclass B extends Component {}",
      errors: [{ messageId: 'globalNamespace' }, { messageId: 'globalNamespace' }],
    },

    {
      code: "import { useState } from 'react';\n"
        + 'const a = React.useState;\nconst b = React.useEffect;\nconst c = React.useMemo;',
      output: "import { useEffect, useMemo, useState } from 'react';\n"
        + 'const a = useState;\nconst b = useEffect;\nconst c = useMemo;',
      errors: [
        { messageId: 'globalNamespace' },
        { messageId: 'globalNamespace' },
        { messageId: 'globalNamespace' },
      ],
    },

    {
      code: 'const useMemo = 1;\nconst a = React.useMemo;\nconst b = React.useState;',
      output: "import { useState } from 'react';\n\nconst useMemo = 1;\nconst a = React.useMemo;\nconst b = useState;",
      errors: [{ messageId: 'globalNamespace' }, { messageId: 'globalNamespace' }],
    },

    {
      code: "import { type ReactNode } from 'react';\nlet value: React.ReactNode;",
      output: "import { type ReactNode } from 'react';\nlet value: ReactNode;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: 'interface ReactNode { own: true }\nlet value: React.ReactNode;',
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: 'let value: React/* why */.ReactNode;',
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: 'let a: React./* why */ReactNode;\nlet b: React.ReactElement;',
      output: "import { type ReactElement } from 'react';\n\nlet a: React./* why */ReactNode;\nlet b: ReactElement;",
      errors: [{ messageId: 'globalNamespace' }, { messageId: 'globalNamespace' }],
    },
    {
      code: 'let value: React.ReactNode /* after */;',
      output: "import { type ReactNode } from 'react';\n\nlet value: ReactNode /* after */;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: 'let probe: typeof React.useState;',
      output: "import { type useState } from 'react';\n\nlet probe: typeof useState;",
      errors: [{
        messageId: 'globalNamespace',
        data: { name: 'useState' },
      }],
    },

    {
      code: "import { useState as useLocal } from 'react';\nconst probe = React.useState;",
      output: "import { useState, useState as useLocal } from 'react';\nconst probe = useState;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: 'function build() {\n  const useState = 1;\n  return React.useState;\n}\nReact.useEffect();',
      output: "import { useEffect } from 'react';\n\n"
        + 'function build() {\n  const useState = 1;\n  return React.useState;\n}\nuseEffect();',
      errors: [{ messageId: 'globalNamespace' }, { messageId: 'globalNamespace' }],
    },

    {
      code: 'export default React.memo(App);',
      output: "import { memo } from 'react';\n\nexport default memo(App);",
      errors: [{ messageId: 'globalNamespace' }],
    },
  ],
});

tsxRuleTester.run('react-no-global-namespace: markup', reactNoGlobalNamespace, {
  valid: [
    "import React from 'react';\nconst el = <React.Fragment />;",
    'const el = <div />;',
    'const el = <Other.Thing />;',

    'const el = <React.JSX.Foo />;',
    'const el = <React:Foo />;',
  ],
  invalid: [
    {
      code: 'const el = <React/* why */.Fragment>text</React.Fragment>;',
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: 'const el = <React.Fragment>text</React./* why */Fragment>;',
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: 'const el = <React.Fragment>{/* keep */}text</React.Fragment>;',
      output: "import { Fragment } from 'react';\n\nconst el = <Fragment>{/* keep */}text</Fragment>;",
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: 'const el = <React.Fragment><React.Fragment /></React.Fragment>;',
      output: "import { Fragment } from 'react';\n\nconst el = <Fragment><Fragment /></Fragment>;",
      errors: [{ messageId: 'globalNamespace' }, { messageId: 'globalNamespace' }],
    },
    {
      code: 'const el = <React.Fragment {...props} key="a">text</React.Fragment>;',
      output: "import { Fragment } from 'react';\n\nconst el = <Fragment {...props} key=\"a\">text</Fragment>;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: 'const el = <React.Fragment />;',
      output: "import { Fragment } from 'react';\n\nconst el = <Fragment />;",
      errors: [{
        messageId: 'globalNamespace',
        data: { name: 'Fragment' },
      }],
    },

    {
      code: 'const el = <React.Fragment>text</React.Fragment>;',
      output: "import { Fragment } from 'react';\n\nconst el = <Fragment>text</Fragment>;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: "import { useState } from 'react';\nconst el = <React.Fragment>t</React.Fragment>;",
      output: "import { Fragment, useState } from 'react';\nconst el = <Fragment>t</Fragment>;",
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: "import type { Fragment } from 'react';\nconst el = <React.Fragment />;",
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },

    {
      code: "import { type Fragment } from 'react';\nconst el = <React.Fragment />;",
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },

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

    "const key = 'createElement';\nReact[key]('div');",

    'other.createElement();',
    'obj.React.useState();',
    'function build(React) {\n  return React.useState;\n}',
  ],
  invalid: [
    {
      code: 'React./* why */useState(0);',
      output: null,
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: 'React?.useState(0);',
      output: "import { useState } from 'react';\n\nuseState(0);",
      errors: [{ messageId: 'globalNamespace' }],
    },
    {
      code: 'React.Children.map(items, render);',
      output: "import { Children } from 'react';\n\nChildren.map(items, render);",
      errors: [{
        messageId: 'globalNamespace',
        data: { name: 'Children' },
      }],
    },

    {
      code: "React.createElement('div');",
      output: "import { createElement } from 'react';\n\ncreateElement('div');",
      errors: [{
        messageId: 'globalNamespace',
        data: { name: 'createElement' },
      }],
    },

    {
      code: "import { useState } from 'react';\nReact.createElement('div');",
      output: "import { createElement, useState } from 'react';\ncreateElement('div');",
      errors: [{ messageId: 'globalNamespace' }],
    },
  ],
});

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
