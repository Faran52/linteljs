import { tsRuleTester, tsxRuleTester } from '@mocks/ruleTesters';

import { nameBeforeUse } from './nameBeforeUse.ts';

const awaitError = { messageId: 'nameAwait' };
const callError = { messageId: 'nameNestedCall' };
const literalError = { messageId: 'nameLiteral' };

const IGNORE_EMPTY = [{ ignoreEmptyLiterals: true }];
const IGNORE_ARGUMENTS = [{ ignoreLiteralArguments: true }];

tsRuleTester.run('name-before-use', nameBeforeUse, {
  valid: [
    'const isUp = await settles(fetch(origin));\nif (isUp) {\n  run();\n}',
    'let value;\nvalue = await load();',
    'await run();',
    'const lsArgs = [\'ls\', \'--all\'];\nrunPm(\'npm\', lsArgs, project);',
    'console.log(format(value));',
    'const total = sum(parse(text));',
    'export default { name: \'alpha\' };',
    'export default [alpha, beta];',
    'const run = (items = []) => {\n  return items;\n};',
    'const { alpha = {} } = source;',
    'class Store {\n  items = [];\n  options = { size: 1 };\n}',

    // Nested literals belong to the named outer one.
    'const config = { plugins: [alpha], rules: { beta: [\'error\', { max: 1 }] } };',
    'const matrix = [[1, 2], [3, 4]];',
    'const items = [...[alpha]];',
    'const options = { ...(exact && { exact }), size };',
    'const options = { ...(flag ? { alpha } : {}) };',
    'const items = [...(flag ? [alpha] : []), beta];',
    'const config = { rules: flag ? { alpha } : { beta } };',

    // A literal a call chain starts from is named with the chain.
    'const code = [alpha, beta].join(\'\\n\');',
    'const text = [alpha, beta].filter(Boolean).join(\' \');',
    'const code = ([alpha] as string[]).join(\'\\n\');',
    'const keys = [alpha]?.map(read);',
    'let text;\ntext = [alpha].join(\' \');',

    // Wrappers stand where they stand.
    'const items = [alpha] as const;',
    'const config = { alpha } satisfies Config;',
    'const value = <Config>{ alpha };',
    'const node = find(parse(text))!;',
    'const value = source?.read(parse(text));',
    'const results = await Promise.all(items.map(load));',
    'const value = await load(parse(text));',
    'const run = async () => {\n  return await load(parse(text));\n};',
    'const run = async () => {\n  return flag ? await load() : fallback;\n};',

    // A ternary's branches and a logical's right side stand where the whole expression does.
    'const rules = withVitest === true ? await loadVitest() : [];',
    'const value = flag ? [alpha] : { alpha };',
    'const value = source ?? await load();',
    'const value = isReady && format(parse(text));',
    'let value;\nvalue = flag || [alpha];',
    'flag ? await load() : await fallback();',

    // Plain values in any position.
    'if (isReady) {\n  run();\n}',
    'items.filter((item) => {\n  return item.isActive;\n});',
    'run(alpha, beta.gamma, \'text\', 1);',
    'expect(result).toBe(expected);',
    'const value = load(alpha)(beta);',

    {
      code: 'run([]);\nconst value = flag ? {} : fallback;',
      options: IGNORE_EMPTY,
    },
    {
      code: 'run([alpha]);\nconst set = new Set([alpha]);\nexpect(value).toEqual({ alpha });\nrun([alpha] as const);',
      options: IGNORE_ARGUMENTS,
    },
  ],
  invalid: [
    {
      code: 'if (await settles(fetch(origin))) {\n  run();\n}',
      errors: [awaitError],
    },
    {
      code: 'runPm(\'npm\', [\'ls\', \'--all\'], project);',
      errors: [
        {
          ...literalError,
          line: 1,
          column: 14,
          endLine: 1,
          endColumn: 29,
        },
      ],
    },
    {
      code: 'const run = async () => {\n  return (await load()).data;\n};',
      errors: [awaitError],
    },
    {
      code: 'const run = async () => {\n  return [await load()];\n};',
      errors: [literalError, awaitError],
    },
    {
      code: 'const run = () => {\n  return format(parse(text));\n};',
      errors: [callError],
    },
    {
      code: 'const run = async () => await load();',
      errors: [awaitError],
    },
    {
      code: 'const value = (await load()).data;',
      errors: [awaitError],
    },
    {
      code: 'run(await load());',
      errors: [awaitError],
    },
    {
      code: 'for (const item of await load()) {\n  use(item);\n}',
      errors: [awaitError],
    },
    {
      code: 'const text = `${await load()}`;',
      errors: [awaitError],
    },
    {
      code: 'const value = { data: await load() };',
      errors: [awaitError],
    },
    {
      code: 'const value = (await load()) ? alpha : beta;',
      errors: [awaitError],
    },
    {
      code: 'if (flag ? await load() : beta) {\n  run();\n}',
      errors: [awaitError],
    },
    {
      code: 'run(flag ? await load() : beta);',
      errors: [awaitError],
    },
    {
      code: 'const value = (await load()) ?? fallback;',
      errors: [awaitError],
    },
    {
      code: 'expect(parse(text)).toBe(expected);',
      errors: [callError],
    },
    {
      code: 'if (isValid(parse(text))) {\n  run();\n}',
      errors: [callError],
    },
    {
      code: 'outer(inner(deepest()));',
      errors: [callError],
    },
    {
      code: 'run(new Wrapper(load()));',
      errors: [callError],
    },
    {
      code: 'run(format(new Date()));',
      errors: [callError],
    },
    {
      code: 'const read = () => format(parse(text));',
      errors: [callError],
    },
    {
      code: 'const total = 1 + sum(parse(text));',
      errors: [callError],
    },
    {
      code: 'const value = { [read(key())]: 1 };',
      errors: [callError],
    },
    {
      code: 'class Store {\n  [read(key())] = 1;\n}',
      errors: [callError],
    },
    {
      code: 'const read = () => {\n  return { alpha };\n};',
      errors: [literalError],
    },
    {
      code: 'const read = () => [alpha];',
      errors: [literalError],
    },
    {
      code: 'run(flag ? [alpha] : []);',
      errors: [literalError, literalError],
    },
    {
      code: 'run(source ?? {});',
      errors: [literalError],
    },
    {
      code: 'const value = [alpha] || fallback;',
      errors: [literalError],
    },
    {
      code: 'for (const item of [alpha, beta]) {\n  use(item);\n}',
      errors: [literalError],
    },
    {
      code: 'const set = new Set([alpha, beta]);',
      errors: [literalError],
    },
    {
      code: 'expect(value).toEqual({ alpha: [1] });',
      errors: [literalError],
    },
    {
      code: 'const size = [alpha, beta].length;',
      errors: [literalError],
    },
    {
      code: 'run(...[alpha]);',
      errors: [literalError],
    },
    {
      code: 'const read = () => {\n  return [alpha].join(\' \');\n};',
      errors: [literalError],
    },
    {
      code: 'const value = { data: [alpha].join(\' \') };',
      errors: [literalError],
    },
    {
      code: 'const value = read([alpha].length);',
      errors: [literalError],
    },
    {
      code: 'const value = lookup[[alpha]]();',
      errors: [literalError],
    },
    {
      code: 'run([alpha].join(\' \'));',
      options: IGNORE_ARGUMENTS,
      errors: [literalError],
    },
    {
      code: 'run({ ...(flag && { alpha }) });',
      errors: [literalError],
    },
    {
      code: 'const items = [...([alpha] || beta)];',
      errors: [literalError],
    },
    {
      code: 'const options = { ...(flag ? await load() : {}) };',
      errors: [awaitError],
    },
    {
      code: 'const value = { [[alpha]]: 1 };',
      errors: [literalError],
    },
    {
      code: 'run([alpha] as const);',
      errors: [literalError],
    },
    {
      code: 'run([], {});\nrun(flag ? [alpha] : { alpha });',
      options: IGNORE_EMPTY,
      errors: [literalError, literalError],
    },
    {
      code: 'const read = () => {\n  return [];\n};\nrun(flag ? [alpha] : fallback);\nrun(source ?? [alpha]);',
      options: IGNORE_ARGUMENTS,
      errors: [
        literalError,
        literalError,
        literalError,
      ],
    },
  ],
});

tsxRuleTester.run('name-before-use in JSX', nameBeforeUse, {
  valid: [
    'const style = { color: \'red\' };\nconst view = <Text style={style} />;',
  ],
  invalid: [
    {
      code: 'const view = <Text style={{ color: \'red\' }} />;',
      errors: [literalError],
    },
  ],
});
