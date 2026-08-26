import { jsRuleTester } from '@mocks/ruleTesters';

import { sortHookDependencies } from './index.ts';

jsRuleTester.run('sort-hook-dependencies', sortHookDependencies, {
  valid: [
    'useEffect(() => {}, []);',
    'useEffect(() => {}, [alpha]);',
    'useEffect(() => {}, [alpha, bravo]);',
    'useCallback(() => {}, [alpha, bravo, charlie]);',
    'useMemo(() => value, [alpha, bravo]);',

    // Natural ordering, so item2 sorts before item10 rather than after it.
    'useEffect(() => {}, [item2, item10]);',

    {
      code: 'useEffect(() => {}, [charlie, bravo, alpha]);',
      options: [{ order: 'desc' }],
    },
    {
      code: 'useEffect(() => {}, [alpha, bravo]);',
      options: [{ order: 'asc' }],
    },
    'useState(() => {}, [bravo, alpha]);',
    'useDeepCompareEffect(() => {}, [bravo, alpha]);',
    {
      code: 'useEffect(() => {}, [bravo, alpha]);',
      options: [{ hooks: ['useCustom'] }],
    },
    'somethingElse(() => {}, [bravo, alpha]);',

    // A member callee is left alone, so `React.useEffect` is not checked.
    'React.useEffect(() => {}, [bravo, alpha]);',
    'useEffect(() => {});',
    'useEffect(() => {}, dependencies);',
    'useEffect();',

    // Anything other than a plain identifier is out of scope: sorting a member expression would mean rewriting text
    // this rule cannot verify.
    'useEffect(() => {}, [bravo.value, alpha]);',
    'useEffect(() => {}, [alpha, bravo()]);',
    'useEffect(() => {}, [...spread, alpha]);',
    "useEffect(() => {}, ['literal', alpha]);",

    // A hole is a null element rather than a node, so the identifier test has to answer for it.
    'useEffect(() => {}, [alpha, , bravo]);',

    // Equal keys under numeric collation give a zero comparator result, so direction must multiply that, not divide it,
    // or a tie flips to infinity.
    {
      code: 'useEffect(() => {}, [item1, item001]);',
      options: [{ order: 'desc' }],
    },
  ],
  invalid: [
    {
      // Rewriting the array from the sorted names would drop the comment with it.
      code: 'useEffect(() => {}, [\n  bravo, // needed\n  alpha,\n]);',
      output: null,
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [bravo, alpha]);',
      output: 'useEffect(() => {}, [alpha, bravo]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useCallback(() => {}, [charlie, alpha, bravo]);',
      output: 'useCallback(() => {}, [alpha, bravo, charlie]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useMemo(() => value, [bravo, alpha]);',
      output: 'useMemo(() => value, [alpha, bravo]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [alpha, bravo]);',
      output: 'useEffect(() => {}, [bravo, alpha]);',
      options: [{ order: 'desc' }],
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [item10, item2]);',
      output: 'useEffect(() => {}, [item2, item10]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      // Only the first out-of-order position reports; one pass fixes the whole array.
      code: 'useEffect(() => {}, [delta, charlie, bravo, alpha]);',
      output: 'useEffect(() => {}, [alpha, bravo, charlie, delta]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {\n  run();\n}, [bravo, alpha]);',
      output: 'useEffect(() => {\n  run();\n}, [alpha, bravo]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      // Case is folded by localeCompare, so Bravo sorts after alpha.
      code: 'useEffect(() => {}, [Bravo, alpha]);',
      output: 'useEffect(() => {}, [alpha, Bravo]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useDeepCompareEffect(() => {}, [bravo, alpha]);',
      output: 'useDeepCompareEffect(() => {}, [alpha, bravo]);',
      options: [{ hooks: ['useDeepCompareEffect'] }],
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'createEffect(() => {}, [bravo, alpha]);',
      output: 'createEffect(() => {}, [alpha, bravo]);',
      options: [{
        hooks: ['createEffect'],
        order: 'asc',
      }],
      errors: [{ messageId: 'sort' }],
    },
  ],
});
