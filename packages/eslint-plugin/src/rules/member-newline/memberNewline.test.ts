import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { memberNewline } from './memberNewline.ts';

const mustSplit = [{ messageId: 'mustSplit' }];

const membersOnNewline = [{ messageId: 'membersOnNewline' }];

jsRuleTester.run('member-newline', memberNewline, {
  valid: [
    'const { alpha } = source;',
    'const {} = source;',
    'const { alpha, bravo } = source;',
    'const { alpha, ...rest } = source;',
    'const {\n  alpha,\n  bravo\n} = source;',
    'const {\n  alpha,\n  /* keep */ bravo\n} = source;',
    'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
    'const {\n  alpha,\n  bravo,\n  charlie,\n} = source;',
    'const {\n  alpha,\n\n  bravo\n} = source;',
    'const { alpha = {\n  first: 1\n}, bravo } = source;',
    'const [alpha, bravo, charlie] = source;',
    'const alpha = source;',

    'const point = {};',
    'const point = { x: 1 };',
    'const point = { x: 1, y: 2 };',
    'const point = { ...base, y: 2 };',
    'const point = {\n  x: 1,\n  y: 2\n};',
    'const point = {\n  x: 1,\n  y: 2,\n  z: 3\n};',
    'const point = {\n  x: 1,\n\n  y: 2,\n  z: 3\n};',
    'const point = { x: 1, draw: () => {\n  paint();\n} };',
    'const point = {\n  x: 1, // across\n  y: 2\n};',
  ],
  invalid: [
    {
      code: 'const { alpha, bravo, charlie } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
      errors: [{
        messageId: 'mustSplit',
        data: { maxProperties: '2' },
      }],
    },
    {
      code: 'const { alpha,\n  bravo } = source;',
      output: 'const {\n  alpha,\n  bravo\n} = source;',
      errors: membersOnNewline,
    },
    {
      code: 'const {\n  alpha, bravo\n} = source;',
      output: 'const {\n  alpha,\n  bravo\n} = source;',
      errors: membersOnNewline,
    },
    {
      code: 'const { alpha, bravo,\n  charlie\n} = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
      errors: membersOnNewline,
    },
    {
      code: 'const {\n  alpha, bravo, charlie } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
      errors: membersOnNewline,
    },
    {
      // The trailing comma stays on the last member's line; `comma-dangle` owns it.
      code: 'const { alpha, bravo, charlie, } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie,\n} = source;',
      errors: mustSplit,
    },
    {
      code: 'const { alpha, /* keep */ bravo, charlie } = source;',
      output: 'const {\n  alpha, /* keep */\n  bravo,\n  charlie\n} = source;',
      errors: mustSplit,
    },
    {
      code: 'const { alpha, bravo, charlie /* tail */ } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie /* tail */\n} = source;',
      errors: mustSplit,
    },
    {
      code: 'const { alpha: {\n  first\n}, bravo, charlie } = source;',
      output: 'const {\n  alpha: {\n  first\n},\n  bravo,\n  charlie\n} = source;',
      errors: mustSplit,
    },
    {
      code: 'function load() {\n  const { alpha, bravo, charlie } = source;\n  return alpha;\n}',
      output: 'function load() {\n  const {\n    alpha,\n    bravo,\n    charlie\n  } = source;\n  return alpha;\n}',
      errors: mustSplit,
    },
    {
      code: 'const { alpha, bravo, ...rest } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  ...rest\n} = source;',
      errors: mustSplit,
    },
    {
      code: 'const {\n  alpha,\n\n  bravo,\n  charlie\n} = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
      errors: [{ messageId: 'noBlankBetween' }],
    },
    {
      code: 'const { alpha, bravo, charlie } = source;\r\n',
      output: 'const {\r\n  alpha,\r\n  bravo,\r\n  charlie\r\n} = source;\r\n',
      errors: mustSplit,
    },

    {
      code: 'const point = { x: 1, y: 2, z: 3 };',
      output: 'const point = {\n  x: 1,\n  y: 2,\n  z: 3\n};',
      errors: mustSplit,
    },
    {
      code: 'const point = { x: 1,\n  y: 2 };',
      output: 'const point = {\n  x: 1,\n  y: 2\n};',
      errors: membersOnNewline,
    },
    {
      code: 'const point = { x: (1), y: 2, ...rest };',
      output: 'const point = {\n  x: (1),\n  y: 2,\n  ...rest\n};',
      errors: mustSplit,
    },
    {
      code: 'if (ready) {\n    draw({ x, y, z });\n}',
      output: 'if (ready) {\n    draw({\n        x,\n        y,\n        z\n    });\n}',
      errors: mustSplit,
    },
  ],
});

jsRuleTester.run('member-newline (options)', memberNewline, {
  valid: [
    {
      code: 'const { alpha, bravo, charlie } = source;',
      options: [{ maxProperties: 3 }],
    },
    {
      code: 'const { alpha } = source;',
      options: [{ maxProperties: 0 }],
    },
    {
      code: 'const {\n  alpha,\n\n  bravo\n} = source;',
      options: [{ maxProperties: 2 }],
    },
  ],
  invalid: [
    {
      code: 'const { alpha, bravo } = source;',
      output: 'const {\n  alpha,\n  bravo\n} = source;',
      options: [{ maxProperties: 1 }],
      errors: [{ message: 'Members must be broken into multiple lines if there are more than 1.' }],
    },
    {
      code: 'const { alpha, bravo, charlie, delta } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie,\n  delta\n} = source;',
      options: [{ maxProperties: 3 }],
      errors: [{ message: 'Members must be broken into multiple lines if there are more than 3.' }],
    },
    {
      code: 'const { alpha, bravo, charlie,\n  delta } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie,\n  delta\n} = source;',
      options: [{ maxProperties: 9 }],
      errors: membersOnNewline,
    },
  ],
});

tsRuleTester.run('member-newline (typescript)', memberNewline, {
  valid: [
    'interface Small {\n  alpha: string;\n  bravo: number;\n}',
    'interface Wide {\n  alpha: string;\n  bravo: number;\n  charlie: boolean;\n}',
    'type Pair = {\n  alpha: string;\n  bravo: number;\n};',
    'type Pair = { alpha: string; bravo: number };',
    'interface Holder { alpha: {\n  first: string;\n}; bravo: number }',

    `interface Documented {
  /** first */
  alpha: string;
  /** second */
  bravo: number;
  /** third */
  charlie: boolean;
}`,
    `interface Documented {
  // first
  alpha: string;
  // second
  bravo: number;
  // third
  charlie: boolean;
}`,
    `interface Mixed {
  alpha: string;
  /**
   * A block that spans lines.
   */
  bravo: number;
  charlie: boolean;
}`,

    'interface Row {\n  meta?: string; // describes meta\n  note?: string; // describes note\n  last: number;\n}',
    'type Row = {\n  meta?: string; // describes meta\n  note?: string; // describes note\n  last: number;\n};',

    'interface Single {\n  alpha: string;\n}',
    'type Single = { alpha: string };',
    'interface Empty {}',
  ],
  invalid: [
    {
      code: 'interface Wide { alpha: string; bravo: number; charlie: boolean }',
      output: 'interface Wide {\n  alpha: string;\n  bravo: number;\n  charlie: boolean\n}',
      errors: mustSplit,
    },
    {
      code: 'namespace Outer {\n  interface Wide { alpha: string; bravo: number; charlie: boolean }\n}',
      output: `namespace Outer {
  interface Wide {
    alpha: string;
    bravo: number;
    charlie: boolean
  }
}`,
      errors: mustSplit,
    },
    {
      code: 'type Wide = { alpha: string, bravo: number, charlie: boolean };',
      output: 'type Wide = {\n  alpha: string,\n  bravo: number,\n  charlie: boolean\n};',
      errors: mustSplit,
    },
    {
      code: 'type Pair = { alpha: string;\n  bravo: number };',
      output: 'type Pair = {\n  alpha: string;\n  bravo: number\n};',
      errors: membersOnNewline,
    },
    {
      code: 'interface Pair {\n  alpha: string; bravo: number;\n}',
      output: 'interface Pair {\n  alpha: string;\n  bravo: number;\n}',
      errors: membersOnNewline,
    },
    {
      code: 'interface Wide {\n  alpha: string;\n  bravo: number; charlie: boolean;\n}',
      output: 'interface Wide {\n  alpha: string;\n  bravo: number;\n  charlie: boolean;\n}',
      errors: membersOnNewline,
    },
    {
      code: 'interface Wide {\n  alpha: string;\n\n  bravo: number;\n  charlie: boolean;\n}',
      output: 'interface Wide {\n  alpha: string;\n  bravo: number;\n  charlie: boolean;\n}',
      errors: [{ messageId: 'noBlankBetween' }],
    },
    {
      // A blank line and a crowded pair in one body: both reported, one fix.
      code: 'interface Wide {\n  alpha: string;\n\n  bravo: number; charlie: boolean;\n}',
      output: 'interface Wide {\n  alpha: string;\n  bravo: number;\n  charlie: boolean;\n}',
      errors: [...membersOnNewline, { messageId: 'noBlankBetween' }],
    },
    {
      code: 'interface Holder { alpha: {\n  first: string;\n}; bravo: number; charlie: boolean }',
      output: 'interface Holder {\n  alpha: {\n  first: string;\n};\n  bravo: number;\n  charlie: boolean\n}',
      errors: mustSplit,
    },
    {
      code: 'interface Wide { /** first */ alpha: string; bravo: number; charlie: boolean }',
      output: 'interface Wide {\n  /** first */ alpha: string;\n  bravo: number;\n  charlie: boolean\n}',
      errors: mustSplit,
    },
    {
      code: 'interface Wide { alpha: string; /* mid */ bravo: number; charlie: boolean }',
      output: 'interface Wide {\n  alpha: string; /* mid */\n  bravo: number;\n  charlie: boolean\n}',
      errors: mustSplit,
    },
    {
      code: 'interface Row {\n  meta?: string; // describes meta\n  note?: string; last: number;\n}',
      output: 'interface Row {\n  meta?: string; // describes meta\n  note?: string;\n  last: number;\n}',
      errors: membersOnNewline,
    },
    {
      code: 'type Wide = { alpha: string; bravo: number; charlie: boolean; /* end */ };',
      output: 'type Wide = {\n  alpha: string;\n  bravo: number;\n  charlie: boolean; /* end */\n};',
      errors: mustSplit,
    },
    {
      code: 'const { alpha, bravo, charlie }: Shape = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n}: Shape = source;',
      errors: mustSplit,
    },
    {
      code: 'declare function load({ alpha, bravo, charlie }?: Options): void;',
      output: 'declare function load({\n  alpha,\n  bravo,\n  charlie\n}?: Options): void;',
      errors: mustSplit,
    },
    {
      code: 'const load = ({ alpha,\n  bravo }: Options = {}) => {};',
      output: 'const load = ({\n  alpha,\n  bravo\n}: Options = {}) => {};',
      errors: membersOnNewline,
    },
    {
      code: 'interface Loader {\n  load({ alpha, bravo, charlie }?: Options): void;\n}',
      output: 'interface Loader {\n  load({\n    alpha,\n    bravo,\n    charlie\n  }?: Options): void;\n}',
      errors: mustSplit,
    },
  ],
});
