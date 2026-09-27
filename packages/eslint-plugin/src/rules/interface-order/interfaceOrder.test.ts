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

    // A default export is a type declaration without being an ExportNamedDeclaration; a looser test would relocate it.
    'const value = 1;\n\nexport default interface Alpha {\n  first: string;\n}',
    'const value = 1;\n\nexport const other = 2;',

    // No runtime statement to sit above; anything but -1 here would treat the third declaration as misplaced.
    'type Alpha = string;\ntype Bravo = number;\ntype Charlie = boolean;',
  ],
  invalid: [
    // A blank line left holding indentation inside a moved declaration comes out empty by default.
    {
      code: 'const value = 1;\n\ninterface Alpha {\n  first: string;\n  \n  second: string;\n}\n',
      output: 'interface Alpha {\n  first: string;\n\n  second: string;\n}\n\nconst value = 1;\n',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    // A blank line only: a line of code keeps whatever follows it, trailing spaces included.
    {
      code: 'const value = 1;\n\ninterface Alpha {\n  first: string;  \n}\n',
      output: 'interface Alpha {\n  first: string;  \n}\n\nconst value = 1;\n',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    // And keeps its indentation when asked to.
    {
      code: 'const value = 1;\n\ninterface Alpha {\n  first: string;\n  \n  second: string;\n}\n',
      options: [{ trimBlankLines: false }],
      output: 'interface Alpha {\n  first: string;\n  \n  second: string;\n}\n\nconst value = 1;\n',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      // A bare expression statement carries a directive key too; testing the key rather than its value would treat
      // `thing();` as part of the prologue.
      code: "import { thing } from 'mod';\n\nconst value = thing;\n\ntype Alpha = string;\n\nthing();\n",
      output: "import { thing } from 'mod';\n\ntype Alpha = string;\n\nconst value = thing;\n\nthing();\n",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      // A directive prologue only counts while nothing precedes it, so a block above `'use client'` would turn the file
      // back into a Server Component.
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
      // The comment belongs to the statement it trails, not to the type below.
      code: 'const value = 1; // why it is one\n\ntype Alpha = string;',
      output: 'type Alpha = string;\n\nconst value = 1; // why it is one',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      // A comment on the first statement stays attached rather than being split off by the inserted block.
      code: '// explains value\nconst value = 1;\n\ntype Alpha = string;',
      output: 'type Alpha = string;\n\n// explains value\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      // Comments inside the body are within the moved range and travel with it.
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
      // A bare call is an expression statement without being a directive; counting it as one would put it in the
      // header.
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
      // The whole prologue is the header, not its first entry: the type lands below the last import.
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
      // A note left behind would end up describing whatever statement the move slides underneath it.
      code: 'const value = 1;\n\ntype Alpha = string; // keep',
      output: 'type Alpha = string; // keep\n\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      // Each declaration must take its own trailing comment with it.
      code: 'const value = 1;\n\ntype Alpha = string; // one\n\ntype Bravo = number; // two',
      output: 'type Alpha = string; // one\n\ntype Bravo = number; // two\n\nconst value = 1;',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      // The block lands after the anchor's trailing note, not between the anchor and its note.
      code: "import { thing } from 'mod'; // note\n\nconst value = thing;\n\ntype Alpha = string;",
      output: "import { thing } from 'mod'; // note\n\ntype Alpha = string;\n\nconst value = thing;",
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      // A comment on the next line down is not this declaration's, so it stays put.
      code: 'const value = 1;\n\ntype Alpha = string;\n// unrelated tail',
      output: 'type Alpha = string;\n\nconst value = 1;\n// unrelated tail',
      errors: [{ messageId: 'moveAfterImports' }],
    },
    {
      // TypeScript resolves type positions lazily, so a derived alias moves like any other declaration.
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

// svelte-eslint-parser puts each `<script>` in `Program.body` as an element, so each script is its own list and the
// fix writes at the script body's indent rather than at column 0.
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
