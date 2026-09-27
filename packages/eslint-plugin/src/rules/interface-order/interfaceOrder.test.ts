import { svelteRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { interfaceOrder } from './interfaceOrder.ts';

tsRuleTester.run('interface-order', interfaceOrder, {
  valid: [
    '',
    'const value = 1;',
    'interface Alpha {\n  first: string;\n}',
    'type Alpha = string;\ntype Bravo = number;',
    "import { thing } from 'mod';\n\ntype Alpha = string;\n\nconst value = thing;",
    `import { thing } from 'mod';

interface Alpha {
  first: string;
}

export type Bravo = number;

const value = thing;`,

    "import { thing } from 'mod';\n\ntype Alpha = string;",
    "const SIZES = ['small'] as const;",
    "type Size = (typeof SIZES)[number];\n\nconst SIZES = ['small'] as const;",

    'const value = 1;\n\nexport default interface Alpha {\n  first: string;\n}',
    'const value = 1;\n\nexport const other = 2;',

    'type Alpha = string;\ntype Bravo = number;\ntype Charlie = boolean;',
  ],
  invalid: [
    {
      code: 'const value = 1;\n\ninterface Alpha {\n  first: string;\n  \n  second: string;\n}\n',
      output: 'interface Alpha {\n  first: string;\n\n  second: string;\n}\n\nconst value = 1;\n',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'const value = 1;\n\ninterface Alpha {\n  first: string;  \n}\n',
      output: 'interface Alpha {\n  first: string;  \n}\n\nconst value = 1;\n',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'const value = 1;\n\ninterface Alpha {\n  first: string;\n  \n  second: string;\n}\n',
      options: [{ trimBlankLines: false }],
      output: 'interface Alpha {\n  first: string;\n  \n  second: string;\n}\n\nconst value = 1;\n',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: "import { thing } from 'mod';\n\nconst value = thing;\n\ntype Alpha = string;\n\nthing();\n",
      output: "import { thing } from 'mod';\n\ntype Alpha = string;\n\nconst value = thing;\n\nthing();\n",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: "'use client';\n\nconst value = 1;\n\ntype Alpha = string;",
      output: "'use client';\n\ntype Alpha = string;\n\nconst value = 1;",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: "'use strict';\n\nconst value = 1;\n\ntype Alpha = string;",
      output: "'use strict';\n\ntype Alpha = string;\n\nconst value = 1;",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'const value = 1; // why it is one\n\ntype Alpha = string;',
      output: 'type Alpha = string;\n\nconst value = 1; // why it is one',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: '// explains value\nconst value = 1;\n\ntype Alpha = string;',
      output: 'type Alpha = string;\n\n// explains value\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'const value = 1;\n\ninterface Shape {\n  /** the first */\n  alpha: string;\n}',
      output: 'interface Shape {\n  /** the first */\n  alpha: string;\n}\n\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },

    {
      code: 'const value = 1;\n\ntype Alpha = string;',
      output: 'type Alpha = string;\n\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'run();\n\ntype Alpha = string;',
      output: 'type Alpha = string;\n\nrun();',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: "import { thing } from 'mod';\n\nconst value = thing;\n\ntype Alpha = string;",
      output: "import { thing } from 'mod';\n\ntype Alpha = string;\n\nconst value = thing;",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: `import { thing } from 'mod';
import { more } from 'other';

const value = thing;

type Alpha = string;`,
      output: `import { thing } from 'mod';
import { more } from 'other';

type Alpha = string;

const value = thing;`,
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: "import { thing } from 'mod';\n\nconst value = thing;\n\ninterface Alpha {\n  first: string;\n}",
      output: "import { thing } from 'mod';\n\ninterface Alpha {\n  first: string;\n}\n\nconst value = thing;",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: "import { thing } from 'mod';\n\nconst value = thing;\n\nexport type Alpha = string;",
      output: "import { thing } from 'mod';\n\nexport type Alpha = string;\n\nconst value = thing;",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'const value = 1;\n\ntype Alpha = string;\n\ntype Bravo = number;',
      output: 'type Alpha = string;\n\ntype Bravo = number;\n\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: "import { thing } from 'mod';\n\ntype Alpha = string;\n\nconst value = thing;\n\ntype Bravo = number;",
      output: "import { thing } from 'mod';\n\ntype Alpha = string;\n\ntype Bravo = number;\n\nconst value = thing;",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'const value = 1;\n\n// what this models\ntype Alpha = string;',
      output: '// what this models\ntype Alpha = string;\n\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'const value = 1;\n\ntype Alpha = string; // keep',
      output: 'type Alpha = string; // keep\n\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'const value = 1;\n\ntype Alpha = string; // one\n\ntype Bravo = number; // two',
      output: 'type Alpha = string; // one\n\ntype Bravo = number; // two\n\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: "import { thing } from 'mod'; // note\n\nconst value = thing;\n\ntype Alpha = string;",
      output: "import { thing } from 'mod'; // note\n\ntype Alpha = string;\n\nconst value = thing;",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'const value = 1;\n\ntype Alpha = string;\n// unrelated tail',
      output: 'type Alpha = string;\n\nconst value = 1;\n// unrelated tail',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: "const SIZES = ['small'] as const;\n\ntype Size = (typeof SIZES)[number];",
      output: "type Size = (typeof SIZES)[number];\n\nconst SIZES = ['small'] as const;",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'enum Colour {\n  Red\n}\n\ntype Shade = typeof Colour;',
      output: 'type Shade = typeof Colour;\n\nenum Colour {\n  Red\n}',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: 'class Service {}\n\ntype Instance = InstanceType<typeof Service>;',
      output: 'type Instance = InstanceType<typeof Service>;\n\nclass Service {}',
      errors: [{ messageId: 'moveAfterImports' }],
    },
  ],
});

const component = (...script: string[]): string => {
  return ['<script lang="ts">', ...script
    .map((line) => {
      return line === '' ? '' : `  ${line}`;
    }), '</script>', '', '<p>{count}</p>', ''].join('\n');
};

svelteRuleTester.run('interface-order: svelte', interfaceOrder, {
  valid: [
    {
      code: component("import { onMount } from 'svelte';", '', 'interface Row { id: number }', '', 'onMount(() => 1);'),
      filename: 'Rows.svelte',
    },
  ],
  invalid: [
    {
      code: component(
        "import { onMount } from 'svelte';",
        '',
        'const count = 1;',
        '',
        'interface Row { id: number }',
        '',
        'onMount(() => count);',
      ),
      filename: 'Rows.svelte',
      output: component(
        "import { onMount } from 'svelte';",
        '',
        'interface Row { id: number }',
        '',
        'const count = 1;',
        '',
        'onMount(() => count);',
      ),
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      code: [
        '<script context="module" lang="ts">',
        '  export const limit = 3;',
        '  export interface Row { id: number }',
        '</script>',
        '',
        '<script lang="ts">',
        '  let rows = [];',
        '  type Id = number;',
        '</script>',
        '',
      ].join('\n'),
      filename: 'Two.svelte',
      output: [
        '<script context="module" lang="ts">',
        '  export interface Row { id: number }',
        '',
        '  export const limit = 3;',
        '</script>',
        '',
        '<script lang="ts">',
        '  type Id = number;',
        '',
        '  let rows = [];',
        '</script>',
        '',
      ].join('\n'),
      errors: [{ messageId: 'moveAfterImports' }, { messageId: 'moveAfterImports' }],
    },
  ],
});
