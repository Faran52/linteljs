import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

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

    'useEffect(() => {}, [alpha, alpha]);',
    'useEffect(() => {}, [bravo, alpha], options);',
    'useEffect(...[bravo, alpha]);',
    'new useEffect(() => {}, [bravo, alpha]);',
    'useEffect`${[bravo, alpha]}`;',
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
      code: 'useEffect(() => {}, [bravo, alpha,]);',
      output: 'useEffect(() => {}, [alpha, bravo,]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [\n  charlie,\n  bravo,\n  alpha,\n]);',
      output: 'useEffect(() => {}, [\n  alpha,\n  bravo,\n  charlie,\n]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [bravo, /* why */ alpha]);',
      output: null,
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [bravo,alpha]);',
      output: 'useEffect(() => {}, [alpha,bravo]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect?.(() => {}, [bravo, alpha]);',
      output: 'useEffect?.(() => {}, [alpha, bravo]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [alpha, Alpha, Bravo, bravo]);',
      output: 'useEffect(() => {}, [alpha, Alpha, bravo, Bravo]);',
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [item2, item10]);',
      output: 'useEffect(() => {}, [item10, item2]);',
      options: [{ order: 'desc' }],
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {\n  useMemo(() => 1, [bravo, alpha]);\n}, [delta, charlie]);',
      output: 'useEffect(() => {\n  useMemo(() => 1, [alpha, bravo]);\n}, [charlie, delta]);',
      errors: [{ messageId: 'sort' }, { messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [bravo, alpha]);',
      output: 'useEffect(() => {}, [alpha, bravo]);',
      options: [{}],
      errors: [{ messageId: 'sort' }],
    },
    {
      code: 'useEffect(() => {}, [alpha, bravo]);',
      output: 'useEffect(() => {}, [bravo, alpha]);',
      options: [{
        order: 'desc',
        hooks: ['useEffect'],
      }],
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

tsRuleTester.run('sort-hook-dependencies (typescript)', sortHookDependencies, {
  valid: [
    'useEffect(() => {}, [bravo!, alpha]);',
    'useEffect(() => {}, [bravo as Value, alpha]);',
  ],
  invalid: [
    {
      code: 'useMemo<Value>(() => value, [bravo, alpha]);',
      output: 'useMemo<Value>(() => value, [alpha, bravo]);',
      errors: [{ messageId: 'sort' }],
    },
  ],
});
