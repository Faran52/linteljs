import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { memberNewline } from './memberNewline.ts';

jsRuleTester.run('member-newline', memberNewline, {
  valid: [
    'const { alpha } = source;',
    'const { alpha, bravo } = source;',
    'const {} = source;',

    'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',

    // A rest element drops the threshold to one, so this has to be split.
    'const {\n  alpha,\n  ...rest\n} = source;',

    // Already one per line with the braces on their own lines, so neither brace gap needs touching.
    'const {\n  alpha,\n  bravo,\n  charlie,\n} = source;',

    // Half-split patterns, both ways round. `destructuring-property-newline` reports this shape and
    // fixes it comma by comma, so this rule says nothing and the reader gets one message for it.
    'const { alpha, bravo,\n  charlie\n} = source;',
    'const {\n  alpha,\n  bravo, charlie\n} = source;',

    // Collapsing would run the line past 120 characters, which `max-len` would then report with
    // nothing able to fix it, so the split form stands.
    'const {\n  alphaProperty = computeSomethingRatherLong(configuration),\n'
    + '  bravoProperty = computeSomethingElseEntirely(configuration)\n} = source;',

    'const [alpha, bravo, charlie] = source;',
    'const alpha = source;',
  ],
  invalid: [
    {
      // The open brace already sits on its own line, so only the closing gap moves.
      code: 'const {\n  alpha, bravo, charlie } = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      // The rebuild cannot carry a comment across, so it reports without a fix rather than deleting the note.
      code: 'const { alpha, /* keep */ bravo, charlie } = source;',
      output: null,
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      // A nested pattern spans lines and is also over the count threshold; the rebuild cannot
      // express the multiline member, so this reports once with no fix.
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
      // Indentation is the whole point: a pattern nested inside a function keeps the
      // function body's column, not column 0.
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
      // The rest threshold is what fires here, so the message names 1 rather than `maxProperties`.
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
      // Under the threshold and split, so the collapse branch, but the rebuild would take the
      // comment with it: the report still goes out and the fix declines.
      code: 'const {\n  alpha,\n  /* keep */ bravo\n} = source;',
      output: null,
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      // Exactly at the limit still collapses: what the guard refuses is a line past it.
      code: 'const {\n  alphaProperty,\n  bravoProperty\n} = source;',
      output: 'const { alphaProperty, bravoProperty } = source;',
      options: [{ maxLineLength: 48 }],
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      // A property that spans lines drags the whole pattern onto newlines, whatever the property count.
      code: 'const { alpha = {\n  first: 1\n}, bravo } = source;',
      output: null,
      errors: [{ messageId: 'multilineMember' }],
    },
    {
      // The multiline property is the last one, checked separately from the pairs before it.
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

    // One character over, so the collapse is refused and the pattern stays as it was written.
    {
      code: 'const {\n  alphaProperty,\n  bravoProperty\n} = source;',
      options: [{ maxLineLength: 47 }],
    },

    // The suffix after the pattern counts too: `= somewhatLongerSource;` is what pushes it over.
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
      // `maxProperties` is deliberately far away from the rest threshold: the message has to name
      // the 1 that fired, not the 9 that did not.
      code: 'const { alpha, ...rest } = source;',
      output: 'const {\n  alpha,\n  ...rest\n} = source;',
      options: [{
        maxProperties: 9,
        maxPropertiesWithRest: 1,
      }],
      errors: [{ message: 'Members must be broken into multiple lines if there are more than 1.' }],
    },
    {
      // And the collapse arm of the same read: under a widened rest threshold, so the message
      // names that threshold rather than `maxProperties`.
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

    // A doc comment above a member is part of that member, not a blank line between two.
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

    // A trailing note belongs to the member before it, not the one after: `getCommentsBefore` hands back both.
    'interface Row {\n  meta?: string; // describes meta\n  note?: string; // describes note\n  last: number;\n}',
    'type Row = {\n  meta?: string; // describes meta\n  note?: string; // describes note\n  last: number;\n};',

    // A single member has no pair to compare, so nothing applies.
    'interface Single {\n  alpha: string;\n}',
    'type Single = { alpha: string };',
    'interface Empty {}',

    // Still nothing to say with the threshold at zero: one member cannot be split off from anything.
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
      // A nested interface body indents from the declaration, not from zero.
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
      // A type literal may separate members with commas, so the split carries the comma
      // the same way it carries a semicolon.
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
      // A member spanning lines forces the whole body open even though there are only two members.
      code: 'interface Holder { alpha: {\n  first: string;\n}; bravo: number }',
      output: 'interface Holder {\n  alpha: {\n  first: string;\n};\n  bravo: number\n}',
      errors: [{ messageId: 'multilineMember' }],
    },
    {
      // The same, but also over the count threshold: the multiline complaint is the whole answer,
      // since carrying on would add a second report for the same body.
      code: 'interface Holder { alpha: {\n  first: string;\n}; bravo: number; charlie: boolean }',
      output: 'interface Holder {\n  alpha: {\n  first: string;\n};\n  bravo: number;\n  charlie: boolean\n}',
      errors: [{ messageId: 'multilineMember' }],
    },
    {
      // Members already on lines of their own are left as the author put them, indentation
      // included; only the pair still sharing a line moves.
      code: 'interface Shape {\n  alpha: string; bravo: number;\n      charlie: boolean;\n}',
      output: 'interface Shape {\n  alpha: string;\n  bravo: number;\n      charlie: boolean;\n}',
      errors: [{ messageId: 'membersOnNewline' }],
    },
    {
      // A comment above a member anchors the split to the comment, not the member, so the doc stays attached.
      code: 'interface Wide { /** first */ alpha: string; bravo: number; charlie: boolean }',
      output: 'interface Wide {\n  /** first */ alpha: string;\n  bravo: number;\n  charlie: boolean\n}',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      // A note between two members stays with the member it follows, so the newline goes in
      // after it, not in front where the splice would delete it.
      code: 'interface Wide { alpha: string; /* mid */ bravo: number; charlie: boolean }',
      output: 'interface Wide {\n  alpha: string; /* mid */\n  bravo: number;\n  charlie: boolean\n}',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      // A comment on the line below heads the next member instead of trailing this one, so the
      // split still anchors on the member.
      code: 'interface Row {\n  alpha: string;\n  // heading for bravo\n  bravo: number; charlie: boolean;\n}',
      output: 'interface Row {\n  alpha: string;\n  // heading for bravo\n  bravo: number;\n  charlie: boolean;\n}',
      errors: [{ messageId: 'membersOnNewline' }],
    },
    {
      // A real violation below a note leaves the note where it was written.
      code: 'interface Row {\n  meta?: string; // describes meta\n  note?: string; last: number;\n}',
      output: 'interface Row {\n  meta?: string; // describes meta\n  note?: string;\n  last: number;\n}',
      errors: [{ messageId: 'membersOnNewline' }],
    },
    {
      // `getLastToken` skips comments, so the gap the closing splice rewrites is exactly where a trailing note lives.
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
      // The pattern carries a type annotation, which has to survive the rebuild or the declaration loses its type.
      code: 'const { alpha, bravo, charlie }: Shape = source;',
      output: 'const {\n  alpha,\n  bravo,\n  charlie\n}: Shape = source;',
      errors: [{ messageId: 'mustSplit' }],
    },
    {
      // The `?` sits inside the node the rebuild replaces; dropping it turns an optional
      // parameter into a required one, a different program.
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
      // Control: a default lives outside the pattern node, in the enclosing `AssignmentPattern`, so it is not at risk.
      code: 'const load = ({ alpha, bravo, charlie }: Options = {}) => {};',
      output: 'const load = ({\n  alpha,\n  bravo,\n  charlie\n}: Options = {}) => {};',
      errors: [{ messageId: 'mustSplit' }],
    },
  ],
});
