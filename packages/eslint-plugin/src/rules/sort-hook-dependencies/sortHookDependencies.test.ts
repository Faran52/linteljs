import { jsRuleTester } from '@mocks/ruleTesters';

import { sortHookDependencies } from './sortHookDependencies.ts';

jsRuleTester.run('sort-hook-dependencies', sortHookDependencies, {
  valid: [
    'useEffect(() => {}, []);',
    'useEffect(() => {}, [alpha]);',
    'useEffect(() => {}, [alpha, bravo]);',
    'useCallback(() => {}, [alpha, bravo, charlie]);',
    'useMemo(() => value, [alpha, bravo]);',

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

    'React.useEffect(() => {}, [bravo, alpha]);',
    'useEffect(() => {});',
    'useEffect(() => {}, dependencies);',
    'useEffect();',

    'useEffect(() => {}, [bravo.value, alpha]);',
    'useEffect(() => {}, [alpha, bravo()]);',
    'useEffect(() => {}, [...spread, alpha]);',
    "useEffect(() => {}, ['literal', alpha]);",

    'useEffect(() => {}, [alpha, , bravo]);',

    {
      code: 'useEffect(() => {}, [item1, item001]);',
      options: [{ order: 'desc' }],
    },
  ],
  invalid: [
    {
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
