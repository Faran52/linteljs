import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { memberNewline } from './memberNewline.ts';

jsRuleTester.run('member-newline', memberNewline, {
  valid: [
    'const { alpha } = source;',
    'const { alpha, bravo } = source;',
    'const {} = source;',

    'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',

    'const {\n  alpha,\n  ...rest\n} = source;',

    'const {\n  alpha,\n  bravo,\n  charlie,\n} = source;',

    'const { alpha, bravo,\n  charlie\n} = source;',
    'const {\n  alpha,\n  bravo, charlie\n} = source;',

    'const {\n  alphaProperty = computeSomethingRatherLong(configuration),\n'
    + '  bravoProperty = computeSomethingElseEntirely(configuration)\n} = source;',

    'const [alpha, bravo, charlie] = source;',
    'const alpha = source;',
  ],
  invalid: [
    {
      code: 'const {\n  alpha, bravo, charlie } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const { alpha, /* keep */ bravo, charlie } = source;',
      output: null,
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const { alpha: {\n  first\n}, bravo, charlie } = source;',
      output: null,
      errors: [{ messageId: 'multilineMember' }],
    },
    {
      code: 'const { alpha, bravo, charlie /* tail */ } = source;',
      output: null,
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const { alpha, bravo, charlie } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'function load() {\n  const { alpha, bravo, charlie } = source;\n  return alpha;\n}',
      output: 'function load() {\n  const {\n    alpha,\n    bravo,\n    charlie\n  } = source;\n  return alpha;\n}',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'if (ready) {\n  if (loaded) {\n    const { alpha, bravo, charlie } = source;\n    use(alpha);\n  }\n}',
      output: `if (ready) {
  if (loaded) {
    const {
      alpha,
      bravo,
      charlie
    } = source;
    use(alpha);
  }
}`,
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const { alpha, ...rest } = source;',
      output: 'const {\n  alpha,\n  ...rest\n} = source;',
      errors: [{
        messageId: 'mustSplit',
        data: { maxProperties: '1' },
      }],
    },
    {
      code: 'const {\n  alpha,\n\n  bravo,\n  charlie\n} = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
      errors: [{ messageId: 'noBlankBetween' }],
    },
    {
      code: 'const {\n  alpha,\n  bravo\n} = source;',
      output: 'const { alpha, bravo } = source;',
      errors: [{
        messageId: 'mustSplit',
        data: { maxProperties: '2' },
      }],
    },
    {
      code: 'const {\n  alpha,\n  /* keep */ bravo\n} = source;',
      output: null,
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const {\n  alphaProperty,\n  bravoProperty\n} = source;',
      output: 'const { alphaProperty, bravoProperty } = source;',
      options: [{ maxLineLength: 48 }],
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const { alpha = {\n  first: 1\n}, bravo } = source;',
      output: null,
      errors: [{ messageId: 'multilineMember' }],
    },
    {
      code: 'const { alpha, bravo = {\n  first: 1\n} } = source;',
      output: null,
      errors: [{ messageId: 'multilineMember' }],
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
      code: 'const { alpha, bravo, charlie, delta } = source;',
      options: [{ maxProperties: 4 }],
    },

    {
      code: 'const { alpha, bravo, ...rest } = source;',
      options: [{ maxPropertiesWithRest: 3 }],
    },

    {
      code: 'const { alpha } = source;',
      options: [{ maxProperties: 0 }],
    },

    {
      code: 'const {\n  alphaProperty,\n  bravoProperty\n} = source;',
      options: [{ maxLineLength: 47 }],
    },

    {
      code: 'const {\n  alphaProperty,\n  bravoProperty\n} = somewhatLongerSource;',
      options: [{ maxLineLength: 48 }],
    },
  ],
  invalid: [
    {
      code: 'const { alpha, bravo } = source;',
      output: 'const {\n  alpha,\n  bravo\n} = source;',
      options: [{ maxProperties: 1 }],
      errors: [{
        messageId: 'mustSplit',
        data: { maxProperties: '1' },
      }],
    },
    {
      code: 'const { alpha, bravo, charlie } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
      options: [{ maxProperties: 2 }],
      errors: [{ message: 'Members must be broken into multiple lines if there are more than 2.' }],
    },
    {
      code: 'const { alpha, bravo, charlie, delta } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie,\n  delta\n} = source;',
      options: [{ maxProperties: 3 }],
      errors: [{ message: 'Members must be broken into multiple lines if there are more than 3.' }],
    },
    {
      code: 'const { alpha, ...rest } = source;',
      output: 'const {\n  alpha,\n  ...rest\n} = source;',
      options: [{
        maxProperties: 9,
        maxPropertiesWithRest: 1,
      }],
      errors: [{ message: 'Members must be broken into multiple lines if there are more than 1.' }],
    },
    {
      code: 'const {\n  alpha,\n  ...rest\n} = source;',
      output: 'const { alpha, ...rest } = source;',
      options: [{
        maxProperties: 9,
        maxPropertiesWithRest: 3,
      }],
      errors: [{ message: 'Members must be broken into multiple lines if there are more than 3.' }],
    },
  ],
});

tsRuleTester.run('member-newline (typescript)', memberNewline, {
  valid: [
    'interface Small {\n  alpha: string;\n  bravo: number;\n}',
    'interface Wide {\n  alpha: string;\n  bravo: number;\n  charlie: boolean;\n}',
    'type Pair = { alpha: string; bravo: number };',

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
    `type Documented = {
  /** first */
  alpha: string;
  /** second */
  bravo: number;
  /** third */
  charlie: boolean;
};`,
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

    {
      code: 'interface Single {\n  alpha: string;\n}',
      options: [{ maxProperties: 0 }],
    },
  ],
  invalid: [
    {
      code: 'interface Wide { alpha: string; bravo: number; charlie: boolean }',
      output: 'interface Wide {\n  alpha: string;\n  bravo: number;\n  charlie: boolean\n}',
      errors: [{ messageId: 'mustSplit' }],
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
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'type Wide = { alpha: string; bravo: number; charlie: boolean };',
      output: 'type Wide = {\n  alpha: string;\n  bravo: number;\n  charlie: boolean\n};',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'type Wide = { alpha: string, bravo: number, charlie: boolean };',
      output: 'type Wide = {\n  alpha: string,\n  bravo: number,\n  charlie: boolean\n};',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'interface Wide {\n  alpha: string;\n  bravo: number; charlie: boolean;\n}',
      output: 'interface Wide {\n  alpha: string;\n  bravo: number;\n  charlie: boolean;\n}',
      errors: [{ messageId: 'membersOnNewline' }],
    },
    {
      code: 'interface Wide {\n  alpha: string;\n\n  bravo: number;\n  charlie: boolean;\n}',
      output: 'interface Wide {\n  alpha: string;\n  bravo: number;\n  charlie: boolean;\n}',
      errors: [{ messageId: 'noBlankBetween' }],
    },
    {
      code: 'interface Holder { alpha: {\n  first: string;\n}; bravo: number }',
      output: 'interface Holder {\n  alpha: {\n  first: string;\n};\n  bravo: number\n}',
      errors: [{ messageId: 'multilineMember' }],
    },
    {
      code: 'interface Holder { alpha: {\n  first: string;\n}; bravo: number; charlie: boolean }',
      output: 'interface Holder {\n  alpha: {\n  first: string;\n};\n  bravo: number;\n  charlie: boolean\n}',
      errors: [{ messageId: 'multilineMember' }],
    },
    {
      code: 'interface Shape {\n  alpha: string; bravo: number;\n      charlie: boolean;\n}',
      output: 'interface Shape {\n  alpha: string;\n  bravo: number;\n      charlie: boolean;\n}',
      errors: [{ messageId: 'membersOnNewline' }],
    },
    {
      code: 'interface Wide { /** first */ alpha: string; bravo: number; charlie: boolean }',
      output: 'interface Wide {\n  /** first */ alpha: string;\n  bravo: number;\n  charlie: boolean\n}',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'interface Wide { alpha: string; /* mid */ bravo: number; charlie: boolean }',
      output: 'interface Wide {\n  alpha: string; /* mid */\n  bravo: number;\n  charlie: boolean\n}',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'interface Row {\n  alpha: string;\n  // heading for bravo\n  bravo: number; charlie: boolean;\n}',
      output: 'interface Row {\n  alpha: string;\n  // heading for bravo\n  bravo: number;\n  charlie: boolean;\n}',
      errors: [{ messageId: 'membersOnNewline' }],
    },
    {
      code: 'interface Row {\n  meta?: string; // describes meta\n  note?: string; last: number;\n}',
      output: 'interface Row {\n  meta?: string; // describes meta\n  note?: string;\n  last: number;\n}',
      errors: [{ messageId: 'membersOnNewline' }],
    },
    {
      code: 'interface Wide { alpha: string; bravo: number; charlie: boolean; /* end */ }',
      output: null,
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'type Wide = { alpha: string; bravo: number; charlie: boolean; /* end */ };',
      output: null,
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const { alpha, bravo, charlie }: Shape = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n}: Shape = source;',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'declare function load({ alpha, bravo, charlie }?: Options): void;',
      output: 'declare function load({\n  alpha,\n  bravo,\n  charlie\n}?: Options): void;',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const load = ({ alpha, bravo, charlie }?: Options): void => {};',
      output: 'const load = ({\n  alpha,\n  bravo,\n  charlie\n}?: Options): void => {};',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'interface Loader {\n  load({ alpha, bravo, charlie }?: Options): void;\n}',
      output: 'interface Loader {\n  load({\n    alpha,\n    bravo,\n    charlie\n  }?: Options): void;\n}',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const load = ({\n  alpha,\n  bravo\n}?: Options) => {};',
      output: 'const load = ({ alpha, bravo }?: Options) => {};',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      code: 'const load = ({ alpha, bravo, charlie }: Options = {}) => {};',
      output: 'const load = ({\n  alpha,\n  bravo,\n  charlie\n}: Options = {}) => {};',
      errors: [{ messageId: 'mustSplit' }],
    },
  ],
});
