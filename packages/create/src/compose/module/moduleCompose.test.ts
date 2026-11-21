import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { moduleCompose } from './moduleCompose';

interface Case {
  name: string;
  base: string;
  option: string;
  expected: string;
}

interface Refusal {
  name: string;
  base: string;
  option: string;
  message: RegExp;
}

interface Composition {
  base: string;
  options: Record<string, string>;
  expected: string;
}

interface RefusedComposition extends Composition {
  message: RegExp | string;
}

interface Ordered {
  name: string;
  base: string;
  option: string;
  plainData: string[];
  pureCalls: string[];
}

interface OrderedCase extends Ordered {
  expected: string;
}

interface DisorderedCase extends Ordered {
  message: string;
}

const templates = join(import.meta.dirname, '../../../templates');
const fixtures = join(templates, 'codegen/compose-sources/vite-react');
const shells = join(templates, 'shells/vite-react');

const readFixture = (name: string): string => {
  const path = join(fixtures, name);

  return readFileSync(path, 'utf8');
};

const readShipped = (name: string): string => {
  const path = join(shells, name);

  return readFileSync(path, 'utf8');
};

const aliasGroup = (alias: string): string[] => {
  const group = [`^${alias}(?:/|$)`];

  return group;
};

// The base layer's groups for a React project with these aliases, as `buildGroups` orders them.
const GROUPS = [
  ['^node:'],
  [
    '^react$',
    '^react-dom$',
    '^react/',
    '^react-',
    '^@react',
  ],
  [String.raw`^@?\w`],
  aliasGroup('@config'),
  aliasGroup('@styles'),
  aliasGroup('@store'),
  aliasGroup('@ui'),
  aliasGroup('@router'),
  [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`],
  [String.raw`^\./`],
  [String.raw`^(?!.*[.](?:css|json)$)[^.].*\u0000$`, String.raw`^[.].*\u0000$`],
  [String.raw`^.+\.s?css$`],
];

// The modules the fixtures read styles and tokens from, which the engine is not given.
const PLAIN_DATA = ['./*.styles', '@styles/tokens.stylex'];

// The modules whose functions the fixtures call, the stylex sheets.
const PURE_CALLS = ['./*.styles'];

const HEADERS: [string, string][] = [
  ['react-routers', 'atomic'],
  ['react-routers', 'css'],
  ['single-page', 'atomic'],
  ['single-page', 'css'],
  ['tanstack-router', 'atomic'],
  ['tanstack-router', 'css'],
];

describe('moduleCompose, on the shipped app header', () => {
  it.each(HEADERS)('writes the shipped file for %s with %s', (router, styling) => {
    const base = readFixture('app-header/AppHeader.tsx');
    const routerOption = readFixture(`app-header/router.${router}.tsx`);
    const stylingOption = readFixture(`app-header/styling.${styling}.ts`);
    const composed = moduleCompose({
      base,
      options: {
        './router': routerOption,
        './styling': stylingOption,
      },
      modules: {},
      plainData: PLAIN_DATA,
      pureCalls: PURE_CALLS,
      importGroups: GROUPS,
    });
    const folder = `router/${router}/styling/${styling}`;
    const expected = readShipped(`${folder}/src/components/features/app-header/AppHeader.tsx`);

    expect(composed).toBe(expected);
  });
});

const HOMES: [string, string, string][] = [
  [
    'libraries',
    'atomic',
    'store/libraries',
  ],
  [
    'libraries',
    'css',
    'store/libraries',
  ],
  [
    'react-state',
    'atomic',
    'data/redux-free/store/react-state',
  ],
  [
    'react-state',
    'css',
    'data/redux-free/store/react-state',
  ],
];

describe('moduleCompose, on the shipped home page', () => {
  it.each(HOMES)('writes the shipped file for %s with %s', (store, styling, folder) => {
    const base = readFixture('home-page/HomePage.tsx');
    const storeOption = readFixture(`home-page/store.${store}.tsx`);
    const stylingOption = readFixture(`home-page/styling.${styling}.ts`);
    const composed = moduleCompose({
      base,
      options: {
        './store': storeOption,
        './styling': stylingOption,
      },
      modules: {},
      plainData: PLAIN_DATA,
      pureCalls: PURE_CALLS,
      importGroups: GROUPS,
    });
    const expected = readShipped(`${folder}/styling/${styling}/src/pages/home/HomePage.tsx`);

    expect(composed).toBe(expected);
  });
});

const SHEETS: [string, string][] = [
  ['libraries', 'store/libraries'],
  ['react-state', 'data/redux-free/store/react-state'],
];

describe('moduleCompose, on the shipped home page style table', () => {
  it.each(SHEETS)('writes the shipped file for %s', (store, folder) => {
    const base = readFixture('home-page-styles/HomePage.styles.ts');
    const storeOption = readFixture(`home-page-styles/store.${store}.ts`);
    const composed = moduleCompose({
      base,
      options: { './store': storeOption },
      modules: {},
      plainData: PLAIN_DATA,
      pureCalls: PURE_CALLS,
      importGroups: GROUPS,
    });
    const expected = readShipped(`${folder}/styling/stylex/src/pages/home/HomePage.styles.ts`);

    expect(composed).toBe(expected);
  });
});

const COMPOSITIONS: Composition[] = [
  ...HEADERS
    .map(([router, styling]): Composition => {
      const composition: Composition = {
        base: 'app-header/AppHeader.tsx',
        options: {
          './router': `app-header/router.${router}.tsx`,
          './styling': `app-header/styling.${styling}.ts`,
        },
        expected: `router/${router}/styling/${styling}/src/components/features/app-header/AppHeader.tsx`,
      };

      return composition;
    }),
  ...HOMES
    .map(([
      store,
      styling,
      folder,
    ]): Composition => {
      const composition: Composition = {
        base: 'home-page/HomePage.tsx',
        options: {
          './store': `home-page/store.${store}.tsx`,
          './styling': `home-page/styling.${styling}.ts`,
        },
        expected: `${folder}/styling/${styling}/src/pages/home/HomePage.tsx`,
      };

      return composition;
    }),
  ...SHEETS
    .map(([store, folder]): Composition => {
      const composition: Composition = {
        base: 'home-page-styles/HomePage.styles.ts',
        options: { './store': `home-page-styles/store.${store}.ts` },
        expected: `${folder}/styling/stylex/src/pages/home/HomePage.styles.ts`,
      };

      return composition;
    }),
];

const LINE_ENDS = [['CRLF', '\r\n'], ['a lone CR', '\r']];

describe.each(LINE_ENDS)('moduleCompose, on inputs that end their lines with %s', (_name, end) => {
  it.each(COMPOSITIONS)('writes the shipped file, with LF, from $base', ({
    base,
    options,
    expected,
  }) => {
    const ended = (text: string): string => {
      return text.replaceAll('\n', end);
    };

    const read = Object.entries(options)
      .map(([specifier, name]) => {
        const option = readFixture(name);
        const pair: [string, string] = [specifier, ended(option)];

        return pair;
      });
    const baseText = readFixture(base);
    const composed = moduleCompose({
      base: ended(baseText),
      options: Object.fromEntries(read),
      modules: {},
      plainData: PLAIN_DATA,
      pureCalls: PURE_CALLS,
      importGroups: GROUPS,
    });
    const shipped = readShipped(expected);

    expect(composed).toBe(shipped);
  });
});

// The six whose options read the stylex sheets or tokens, which the engine is not given.
const READS_PLAIN_DATA = COMPOSITIONS
  .filter(({ options }) => {
    return Object.values(options)
      .some((name) => {
        return name.includes('atomic') || name.endsWith('store.libraries.ts');
      });
  });

// The two whose router spreads what `styles.tab` answers before it renders the children.
const CALLS_TAB = COMPOSITIONS
  .filter(({ options }) => {
    const isAtomic = options['./styling'] === 'app-header/styling.atomic.ts';

    return isAtomic && options['./router'] !== 'app-header/router.react-routers.tsx';
  });

const READ_REFUSAL = /is not shown to be a plain property, so reading it may run code: give the engine/u;

const ORDER_REFUSAL = 'An argument with an effect must run first, and "children" is read after this, which may act: '
  + '{...sx.tab(';

const NO_PLAIN_DATA = READS_PLAIN_DATA
  .map((composition): RefusedComposition => {
    const refused: RefusedComposition = {
      ...composition,
      message: CALLS_TAB.includes(composition) ? ORDER_REFUSAL : READ_REFUSAL,
    };

    return refused;
  });

const composedFrom = ({ base, options }: Composition, plainData: string[], pureCalls: string[]): string => {
  const read = Object.entries(options)
    .map(([specifier, name]) => {
      const pair: [string, string] = [specifier, readFixture(name)];

      return pair;
    });
  const baseText = readFixture(base);

  return moduleCompose({
    base: baseText,
    options: Object.fromEntries(read),
    modules: {},
    plainData,
    pureCalls,
    importGroups: GROUPS,
  });
};

describe('moduleCompose, on the shipped compositions with no module declared plain data', () => {
  it('finds six that read one, two of them spreading what a stylex call answers', () => {
    expect(READS_PLAIN_DATA).toHaveLength(6);
    expect(CALLS_TAB).toHaveLength(2);
  });

  it.each(NO_PLAIN_DATA)('refuses $options', (refused) => {
    const run = (): string => {
      return composedFrom(refused, [], []);
    };

    expect(run).toThrow(refused.message);
  });
});

describe('moduleCompose, on the shipped compositions with no module declared pure calls', () => {
  it.each(CALLS_TAB)('refuses to render the children of $options after a stylex call', (composition) => {
    const run = (): string => {
      return composedFrom(composition, PLAIN_DATA, []);
    };

    expect(run).toThrow(ORDER_REFUSAL);
  });
});

// A component that renders its children after `root`'s attributes, and a base that passes it children that act.
const rendering = (root: string, head: string): string => {
  const props = root.includes('setup') ? 'setup, children' : 'children';

  return `${head}export const X = ({ ${props} }: P) => (\n  <a ${root}>{children}</a>\n);\n`;
};

const passing = (names: string, attributes: string, before: string): string => {
  const imports = `import { ${names} } from './p';\n\n`;

  return `${imports}export const B = () => {\n${before}  return <X${attributes}>{f()}</X>;\n};\n`;
};

const STYLES = 'import { st } from \'./a.styles\';\n\n';

const SETUP = 'export const useSetup = () => {\n  const t = \'x\';\n\n  return { t };\n};\n';

const ORDERED: OrderedCase[] = [
  {
    name: 'a member read proven by source',
    base: passing('X, s', '', ''),
    option: rendering('title={s.a}', 'export const s = { a: \'x\' };\n'),
    plainData: [],
    pureCalls: [],
    expected: 'export const B = () => {\n  return <a title={\'x\'}>{f()}</a>;\n};\n',
  },
  {
    name: 'a call into a module declared pure calls',
    base: passing('X', '', ''),
    option: rendering('title={st.tab(1)}', STYLES),
    plainData: [],
    pureCalls: ['./*.styles'],
    expected: `${STYLES}export const B = () => {\n  return <a title={st.tab(1)}>{f()}</a>;\n};\n`,
  },
  {
    name: 'a spread of what a call answers, its module declared both pure calls and plain data',
    base: passing('X', '', ''),
    option: rendering('{...st.tab(1)}', STYLES),
    plainData: ['./*.styles'],
    pureCalls: ['./*.styles'],
    expected: `${STYLES}export const B = () => {\n  return <a {...st.tab(1)}>{f()}</a>;\n};\n`,
  },
  {
    name: 'a member read of a prop followed through the site and an option call to the literal it returns',
    base: passing('X, useSetup', ' setup={setup}', '  const setup = useSetup();\n\n'),
    option: rendering('title={setup.t}', SETUP),
    plainData: [],
    pureCalls: [],
    expected: 'export const B = () => {\n  const t = \'x\';\n\n  return <a title={t}>{f()}</a>;\n};\n',
  },
  {
    name: 'a template of values proven primitive',
    base: passing('X, s', '', ''),
    option: rendering('title={`${s.a}-${1 + s.b}`}', 'export const s = { a: \'x\', b: 2 };\n'),
    plainData: [],
    pureCalls: [],
    expected: 'export const B = () => {\n  return <a title={`${\'x\'}-${1 + 2}`}>{f()}</a>;\n};\n',
  },
];

const MAY_ACT = 'An argument with an effect must run first, and "children" is read after this, which may act: ';

const DISORDERED: DisorderedCase[] = [
  {
    name: 'an unproven call',
    base: passing('X', '', ''),
    option: rendering('title={String(1)}', ''),
    plainData: [],
    pureCalls: [],
    message: `${MAY_ACT}String(1)`,
  },
  {
    name: 'a call into a module declared plain data only',
    base: passing('X', '', ''),
    option: rendering('title={st.tab(1)}', STYLES),
    plainData: ['./*.styles'],
    pureCalls: [],
    message: `${MAY_ACT}st.tab(1)`,
  },
  {
    name: 'a spread of what a call answers, its module declared pure calls only',
    base: passing('X', '', ''),
    option: rendering('{...st.tab(1)}', STYLES),
    plainData: [],
    pureCalls: ['./*.styles'],
    message: `${MAY_ACT}{...st.tab(1)}`,
  },
  {
    name: 'a spread of what a call answers, its module declared plain data only',
    base: passing('X', '', ''),
    option: rendering('{...st.tab(1)}', STYLES),
    plainData: ['./*.styles'],
    pureCalls: [],
    message: `${MAY_ACT}{...st.tab(1)}`,
  },
  {
    name: 'a prop read whose argument comes from a call site outside the program',
    base: 'import { X } from \'./p\';\n\nexport const B = (props: Q) => <X setup={props.setup}>{f()}</X>;\n',
    option: rendering('title={setup.t}', ''),
    plainData: [],
    pureCalls: [],
    message: `${MAY_ACT}setup.t`,
  },
  {
    name: 'a prop read whose argument is a let',
    base: passing('X', ' setup={setup}', '  let setup = { t: \'x\' };\n\n'),
    option: rendering('title={setup.t}', ''),
    plainData: [],
    pureCalls: [],
    message: `${MAY_ACT}setup.t`,
  },
  {
    name: 'a prop read whose argument is answered by a function the engine cannot enter',
    base: passing('X', ' setup={setup}', '  const setup = make();\n\n'),
    option: rendering('title={setup.t}', ''),
    plainData: [],
    pureCalls: [],
    message: `${MAY_ACT}setup.t`,
  },
  {
    name: 'a prop read the base leaves to a destructured rest',
    base: 'import { X } from \'./p\';\n\nexport const B = ({ ...rest }: Q) => <X {...rest}>{f()}</X>;\n',
    option: rendering('title={setup.t}', ''),
    plainData: [],
    pureCalls: [],
    message: `${MAY_ACT}setup.t`,
  },
  {
    name: 'a prop read whose option call has a return it cannot follow',
    base: passing('X, useSetup', ' setup={setup}', '  const setup = useSetup();\n\n'),
    option: rendering(
      'title={setup.t}',
      'export const useSetup = () => {\n  if (c) {\n    return { t: \'x\' };\n  }\n\n  return make();\n};\n',
    ),
    plainData: [],
    pureCalls: [],
    message: `${MAY_ACT}setup.t`,
  },
  {
    name: 'a call of what a call answers, its module declared both pure calls and plain data',
    base: passing('X', '', ''),
    option: rendering('title={st.tab(1)(2)}', STYLES),
    plainData: ['./*.styles'],
    pureCalls: ['./*.styles'],
    message: `${MAY_ACT}st.tab(1)(2)`,
  },
  {
    name: 'a template of a value not proven primitive',
    base: passing('X', '', ''),
    option: rendering('title={`${location}`}', ''),
    plainData: [],
    pureCalls: [],
    message: `${MAY_ACT}\`\${location}\``,
  },
  {
    name: 'a sum with a value of a module declared plain data, which may be an object',
    base: passing('X', '', ''),
    option: rendering('title={st.a + 1}', STYLES),
    plainData: ['./*.styles'],
    pureCalls: [],
    message: `${MAY_ACT}st.a + 1`,
  },
  {
    name: 'children read twice',
    base: passing('X', '', ''),
    option: 'export const X = ({ children }: P) => (\n  <a>{children}{children}</a>\n);\n',
    plainData: [],
    pureCalls: [],
    message: 'An argument with an effect must be read once, and "children" is read 2 times: f()',
  },
  {
    name: 'children deferred into a function',
    base: passing('X', '', ''),
    option: 'export const X = ({ children }: P) => (\n  <a>{[1].map(() => children)}</a>\n);\n',
    plainData: [],
    pureCalls: [],
    message: 'An argument with an effect must run where the call did, and "children" is read later: f()',
  },
];

describe('moduleCompose, on children that act, rendered after other code', () => {
  it.each(ORDERED)('renders them after $name', ({
    base,
    option,
    plainData,
    pureCalls,
    expected,
  }) => {
    const composed = moduleCompose({
      base,
      options: { './p': option },
      modules: {},
      plainData,
      pureCalls,
    });

    expect(composed).toBe(expected);
  });

  it.each(DISORDERED)('refuses to render them after $name', ({
    base,
    option,
    plainData,
    pureCalls,
    message,
  }) => {
    const run = (): string => {
      return moduleCompose({
        base,
        options: { './p': option },
        modules: {},
        plainData,
        pureCalls,
      });
    };

    expect(run).toThrow(message);
  });
});

const READ_BASE = 'import { x } from \'./p\';\n\nexport const y = x.m;\n';

const SIBLING_READ = 'import { t } from \'./t\';\n\nexport const x = { m: t.a };\n';

describe('moduleCompose, on a member read it moves', () => {
  it('takes a plain property of a literal in the option file as proven by source', () => {
    const composed = moduleCompose({
      base: 'import { t, x } from \'./p\';\n\nexport const y = [x.m, t.b];\n',
      options: { './p': 'export const t = { a: 1, b: 2 };\nexport const x = { m: t.a };\n' },
      modules: {},
      plainData: [],
      pureCalls: [],
    });

    expect(composed).toBe('export const y = [1, 2];\n');
  });

  it('refuses a getter of a literal in the option file', () => {
    const run = (): string => {
      return moduleCompose({
        base: 'import { t, x } from \'./p\';\n\nexport const y = [x.m, t];\n',
        options: { './p': 'export const t = { get a() { return 1; } };\nexport const x = { m: t.a };\n' },
        modules: {},
        plainData: [],
        pureCalls: [],
      });
    };

    expect(run).toThrow('"a" of "t" is not shown to be a plain property of an object literal, so reading it may run');
  });

  it('takes a plain property of a literal in a sibling module it is given as proven by source', () => {
    const composed = moduleCompose({
      base: READ_BASE,
      options: { './p': SIBLING_READ },
      modules: { './t': 'export const t = { a: 1 };\n' },
      plainData: [],
      pureCalls: [],
    });

    expect(composed).toBe('import { t } from \'./t\';\n\nexport const y = t.a;\n');
  });

  it('refuses a getter in a sibling module it is given', () => {
    const run = (): string => {
      return moduleCompose({
        base: READ_BASE,
        options: { './p': SIBLING_READ },
        modules: { './t': 'export const t = { get a() { return 1; } };\n' },
        plainData: [],
        pureCalls: [],
      });
    };

    expect(run).toThrow('"a" of ./t is not shown to be a plain property');
  });

  it('refuses a read of a module it is neither given nor told is plain data', () => {
    const run = (): string => {
      return moduleCompose({
        base: READ_BASE,
        options: { './p': SIBLING_READ },
        modules: {},
        plainData: [],
        pureCalls: [],
      });
    };

    const message = '"a" of ./t is not shown to be a plain property, so reading it may run code: give the engine that '
      + 'module, or declare it plain data: t.a';

    expect(run).toThrow(message);
  });

  it('takes a read two members deep of a module declared plain data', () => {
    const composed = moduleCompose({
      base: READ_BASE,
      options: { './p': 'import { t } from \'./t.styles\';\n\nexport const x = { m: t.a.b };\n' },
      modules: {},
      plainData: ['./*.styles'],
      pureCalls: [],
    });

    expect(composed).toBe('import { t } from \'./t.styles\';\n\nexport const y = t.a.b;\n');
  });

  it('refuses a read of a module the declared pattern does not match, a star never crossing a slash', () => {
    const run = (): string => {
      return moduleCompose({
        base: READ_BASE,
        options: { './p': 'import { t } from \'./a/t.styles\';\n\nexport const x = { m: t.a };\n' },
        modules: {},
        plainData: ['./*.styles'],
        pureCalls: [],
      });
    };

    expect(run).toThrow('"a" of ./a/t.styles is not shown to be a plain property');
  });
});

describe('moduleCompose, on inputs that open with a byte order mark', () => {
  it('keeps the base\'s mark in front of what replaces its imports', () => {
    const base = '\uFEFFimport { x } from \'./p\';\n\nexport const y = x;\n';
    const composed = moduleCompose({
      base,
      options: { './p': 'export const x = 1;\n' },
      modules: {},
      plainData: [],
      pureCalls: [],
    });

    expect(composed).toBe('\uFEFFexport const y = 1;\n');
  });

  it('keeps the mark of a base that opens with no import', () => {
    const composed = moduleCompose({
      base: '\uFEFFexport const y = 1;\n',
      options: {},
      modules: {},
      plainData: [],
      pureCalls: [],
    });

    expect(composed).toBe('\uFEFFexport const y = 1;\n');
  });

  it('writes no mark for a base without one, whatever its options open with', () => {
    const composed = moduleCompose({
      base: 'import { x } from \'./p\';\n\nexport const y = x;\n',
      options: { './p': '\uFEFFexport const x = 1;\n' },
      modules: {},
      plainData: [],
      pureCalls: [],
    });

    expect(composed).toBe('export const y = 1;\n');
  });
});

const CASES: Case[] = [
  {
    name: 'a base binding that shadows a parameter binding, read as the base wrote it',
    base: 'import { x } from \'./p\';\n\nexport const y = (x: number) => x;\n',
    option: 'export const x = 1;\n',
    expected: 'export const y = (x: number) => x;\n',
  },
  {
    name: 'a member of an object export',
    base: 'import { table } from \'./p\';\n\nexport const size = table.size;\n',
    option: 'export const table = { size: 4 };\n',
    expected: 'export const size = 4;\n',
  },
  {
    name: 'a member through satisfies',
    base: 'import { table } from \'./p\';\n\nexport const size = table.size;\n',
    option: 'export const table = { size: 4 } satisfies Record<string, number>;\n',
    expected: 'export const size = 4;\n',
  },
  {
    name: 'a member call, its argument kept whole',
    base: 'import { table } from \'./p\';\n\nexport const twice = (x: number) => table.double(x + 1);\n',
    option: 'export const table = { double: (n: number) => n * 2 };\n',
    expected: 'export const twice = (x: number) => (x + 1) * 2;\n',
  },
  {
    name: 'a member call whose function returns from a block',
    base: 'import { table } from \'./p\';\n\nexport const twice = (x: number) => table.double(x);\n',
    option: 'export const table = { double: (n: number) => {\n  return n * 2;\n} };\n',
    expected: 'export const twice = (x: number) => x * 2;\n',
  },
  {
    name: 'a direct call',
    base: 'import { loud } from \'./p\';\n\nexport const title = loud(\'a\');\n',
    option: 'export const loud = (text: string) => `${text}!`;\n',
    expected: 'export const title = `${\'a\'}!`;\n',
  },
  {
    name: 'a constant, parenthesized where the position needs it',
    base: 'import { LIMIT } from \'./p\';\n\nexport const next = LIMIT * 2;\n',
    option: 'export const LIMIT = 1 + 2;\n',
    expected: 'export const next = (1 + 2) * 2;\n',
  },
  {
    name: 'a type an interface extends, beside one it keeps',
    base: [
      'import type { Extra } from \'./p\';',
      '',
      'export interface Props extends Own, Extra {',
      '  readonly name: string;',
      '}',
      '',
    ].join('\n'),
    option: 'export interface Extra {\n  readonly more: number;\n}\n',
    expected: 'export interface Props extends Own {\n  readonly name: string;\n  readonly more: number;\n}\n',
  },
  {
    name: 'a type literal joining an empty interface',
    base: 'import type { Extra } from \'./p\';\n\nexport interface Props extends Extra {\n}\n',
    option: 'export type Extra = {\n    readonly more: number;\n};\n',
    expected: 'export interface Props {\n  readonly more: number;\n}\n',
  },
  {
    name: 'an empty object type, which only leaves',
    base: [
      'import type { Extra } from \'./p\';',
      '',
      'export interface Props extends Extra {',
      '  readonly name: string;',
      '}',
      '',
    ].join('\n'),
    option: 'export type Extra = Record<never, never>;\n',
    expected: 'export interface Props {\n  readonly name: string;\n}\n',
  },
  {
    name: 'a one-line component, its key and string attribute carried over',
    base: 'import { Item } from \'./p\';\n\nexport const list = <ul><Item key="a" label="A" /></ul>;\n',
    option: 'export const Item = ({ label }: Props) => <li title={label}>{label}</li>;\n',
    expected: 'export const list = <ul><li key="a" title={\'A\'}>{\'A\'}</li></ul>;\n',
  },
  {
    name: 'a component with no props, and a bare attribute it ignores',
    base: 'import { Rule } from \'./p\';\n\nexport const line = <Rule dense />;\n',
    option: 'export const Rule = () => <hr />;\n',
    expected: 'export const line = <hr />;\n',
  },
  {
    name: 'children the option does not render, when the base passes none',
    base: 'import { Box } from \'./p\';\n\nexport const box = (\n  <Box />\n);\n',
    option: [
      'export const Box = ({ children }: Props) => {',
      '  return (',
      '    <div>',
      '      {children}',
      '    </div>',
      '  );',
      '};',
      '',
    ].join('\n'),
    expected: 'export const box = (\n  <div>\n  </div>\n);\n',
  },
  {
    name: 'statements, their answer read by name',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return thing.value + thing.other;',
      '};',
      '',
    ].join('\n'),
    option: [
      'export const useThing = () => {',
      '  const value = 1;',
      '  const other = 2;',
      '',
      '  return { value, other };',
      '};',
      '',
    ].join('\n'),
    expected: 'export const run = () => {\n  const value = 1;\n  const other = 2;\n\n  return value + other;\n};\n',
  },
  {
    name: 'statements that answer nothing, between two others',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const a = 1;',
      '  const thing = useThing();',
      '  const b = 2;',
      '',
      '  return a + b;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = () => {\n};\n',
    expected: 'export const run = () => {\n  const a = 1;\n  const b = 2;\n\n  return a + b;\n};\n',
  },
  {
    name: 'a call that initializes a constant with an expression',
    base: 'import { make } from \'./p\';\n\nexport const made = make();\n',
    option: 'export const make = () => 4;\n',
    expected: 'export const made = 4;\n',
  },
  {
    name: 'a comment directive the option answers',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./p#note\n  return x;\n};\n',
    option: 'export const note = \'Why this is so.\';\nexport const x = 1;\n',
    expected: 'export const run = () => {\n  // Why this is so.\n  return 1;\n};\n',
  },
  {
    name: 'a comment directive the option leaves out',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./p#note\n  return x;\n};\n',
    option: 'export const x = 1;\n',
    expected: 'export const run = () => {\n  return 1;\n};\n',
  },
  {
    name: 'a constant read as a shorthand member',
    base: 'import { size } from \'./p\';\n\nexport const box = { size };\n',
    option: 'export const size = 4;\n',
    expected: 'export const box = { size: 4 };\n',
  },
  {
    name: 'an object answered from an arrow body, kept in parentheses',
    base: 'import { table } from \'./p\';\n\nexport const make = () => table.empty;\n',
    option: 'export const table = { empty: {} };\n',
    expected: 'export const make = () => ({});\n',
  },
];

const REFUSALS: Refusal[] = [
  {
    name: 'an export the option module lacks',
    base: 'import { x } from \'./p\';\n\nexport const y = x;\n',
    option: 'export const other = 1;\n',
    message: /"x" has no export in its option module \(\.\/p\)/u,
  },
  {
    name: 'a member the option object lacks',
    base: 'import { table } from \'./p\';\n\nexport const y = table.gone;\n',
    option: 'export const table = { size: 4 };\n',
    message: /has no member "gone"/u,
  },
  {
    name: 'a member read from something that is not an object',
    base: 'import { table } from \'./p\';\n\nexport const y = table.size;\n',
    option: 'export const table = 4;\n',
    message: /must be an object literal/u,
  },
  {
    name: 'a member called that is not a function',
    base: 'import { table } from \'./p\';\n\nexport const y = table.size();\n',
    option: 'export const table = { size: 4 };\n',
    message: /must be an arrow function/u,
  },
  {
    name: 'a member with an effect read as a value',
    base: 'import { table } from \'./p\';\n\nexport const y = table.now;\n',
    option: 'export const table = { now: Date.now() };\n',
    message: /must have no effect/u,
  },
  {
    name: 'a call of an export that is not a function',
    base: 'import { make } from \'./p\';\n\nexport const y = [make()];\n',
    option: 'export const make = 4;\n',
    message: /must be an arrow function/u,
  },
  {
    name: 'a function inlined as an expression that does more than return',
    base: 'import { make } from \'./p\';\n\nexport const y = [make()];\n',
    option: 'export const make = () => {\n  const a = 1;\n\n  return a;\n};\n',
    message: /must only return one/u,
  },
  {
    name: 'an argument that the option\'s own binding would capture',
    base: 'import { table } from \'./p\';\n\nexport const y = (inner: number) => table.twice(inner);\n',
    option: 'export const table = { twice: (n: number) => [n].map((inner) => inner + n) };\n',
    message: /would capture it/u,
  },
  {
    name: 'an argument with an effect read twice',
    base: 'import { table } from \'./p\';\n\nexport const y = table.twice(next());\n',
    option: 'export const table = { twice: (n: number) => n + n };\n',
    message: /must be read once, and "n" is read 2 times/u,
  },
  {
    name: 'a call with fewer arguments than parameters',
    base: 'import { table } from \'./p\';\n\nexport const y = table.twice();\n',
    option: 'export const table = { twice: (n: number) => n + n };\n',
    message: /plain name with an argument/u,
  },
  {
    name: 'a constant with an effect',
    base: 'import { now } from \'./p\';\n\nexport const y = now;\n',
    option: 'export const now = Date.now();\n',
    message: /must be a constant with no effect/u,
  },
  {
    name: 'an option type used outside an extends clause',
    base: 'import type { Extra } from \'./p\';\n\nexport type Props = Own & Extra;\n',
    option: 'export interface Extra {\n  readonly more: number;\n}\n',
    message: /only be used as a type an interface extends/u,
  },
  {
    name: 'an option type an interface cannot take the members of',
    base: 'import type { Extra } from \'./p\';\n\nexport interface Props extends Extra {\n}\n',
    option: 'export type Extra = Other;\n',
    message: /must be an interface, a type literal or Record<never, never>/u,
  },
  {
    name: 'statements that take a parameter',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing(1);',
      '',
      '  return thing.value;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = (seed: number) => {\n  const value = seed;\n\n  return { value };\n};\n',
    message: /take no parameters/u,
  },
  {
    name: 'statements that return early',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return thing.value;',
      '};',
      '',
    ].join('\n'),
    option: [
      'export const useThing = () => {',
      '  if (flag) {',
      '    return { value };',
      '  }',
      '',
      '  const value = 1;',
      '',
      '  return { value };',
      '};',
      '',
    ].join('\n'),
    message: /may only return at the end/u,
  },
  {
    name: 'statements that answer something other than plain names',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return thing.value;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = () => {\n  const inner = 1;\n\n  return { value: inner };\n};\n',
    message: /must answer an object of plain names/u,
  },
  {
    name: 'statements that declare a name the base already binds',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = (value: number) => {',
      '  const thing = useThing();',
      '',
      '  return thing.value;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = () => {\n  const value = 1;\n\n  return { value };\n};\n',
    message: /declare "value", which the base already binds here/u,
  },
  {
    name: 'a holder read whole rather than by member',
    base: [
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return thing;',
      '};',
      '',
    ].join('\n'),
    option: 'export const useThing = () => {\n  const value = 1;\n\n  return { value };\n};\n',
    message: /"thing" can only be read by a member/u,
  },
  {
    name: 'a component that is not a function',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item />;\n',
    option: 'export const Item = 4;\n',
    message: /must be an arrow function/u,
  },
  {
    name: 'a component that returns no element',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item />;\n',
    option: 'export const Item = () => 4;\n',
    message: /must return one element/u,
  },
  {
    name: 'a component that renames a prop',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item label="a" />;\n',
    option: 'export const Item = ({ label: text }: Props) => <li>{text}</li>;\n',
    message: /must destructure plain props/u,
  },
  {
    name: 'a prop the base does not pass',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item />;\n',
    option: 'export const Item = ({ label }: Props) => <li>{label}</li>;\n',
    message: /needs "label", which the base does not pass/u,
  },
  {
    name: 'an ignored attribute with an effect',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item stamp={Date.now()} />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /ignores "stamp", whose value has an effect/u,
  },
  {
    name: 'children the option does not render',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item>text</Item>;\n',
    option: 'export const Item = () => <li />;\n',
    message: /must render \{children\} once/u,
  },
  {
    name: 'children used as a value',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item>text</Item>;\n',
    option: 'export const Item = ({ children }: Props) => <li title={String(children)}>{children}</li>;\n',
    message: /can only render its children in place/u,
  },
  {
    name: 'a key on a component that returns a fragment',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item key="a" />;\n',
    option: 'export const Item = () => <></>;\n',
    message: /A key needs an element/u,
  },
  {
    name: 'a spread that is not a rest binding',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item {...props} />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /Only a rest binding can be spread/u,
  },
  {
    name: 'two spreads on one component',
    base: 'import { Item } from \'./p\';\n\nexport const List = ({ ...a }) => <Item {...a} {...a} />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /One rest spread at most/u,
  },
  {
    name: 'a rest binding also read elsewhere',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ ...rest }) => <ul title={String(rest)}><Item {...rest} /></ul>;',
      '',
    ].join('\n'),
    option: 'export const Item = () => <li />;\n',
    message: /"rest" is still read after composing/u,
  },
  {
    name: 'a comment directive naming a module that is not a parameter',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./q#note\n  return x;\n};\n',
    option: 'export const x = 1;\n',
    message: /\.\/q is not a parameter module/u,
  },
  {
    name: 'a comment directive naming an export that is not a string',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./p#x\n  return x;\n};\n',
    option: 'export const x = 1;\n',
    message: /\.\/p#x must be a string/u,
  },
  {
    name: 'a default import of a parameter module',
    base: 'import p from \'./p\';\n\nexport const y = p;\n',
    option: 'export const x = 1;\n',
    message: /is a parameter module; import its exports by name/u,
  },
  {
    name: 'one name imported from two sources',
    base: 'import { join } from \'node:path\';\nimport { x } from \'./p\';\n\nexport const y = join(x);\n',
    option: 'import { join } from \'./strings\';\n\nexport const x = join(\'a\');\n',
    message: /"join" is imported from node:path#join and from \.\/strings#join/u,
  },
];

const MORE_CASES: Case[] = [
  {
    name: 'an option interface\'s member comments, kept where its members join (F22)',
    base: 'import type { Extra } from \'./p\';\n\nexport interface Mine extends Extra {\n  own: string;\n}\n',
    option: 'export interface Extra {\n  /** The label shown. */\n  label: string;\n  // why\n  other: number;\n}\n',
    expected: 'export interface Mine {\n  own: string;\n  /** The label shown. */\n  label: string;\n  // why\n'
      + '  other: number;\n}\n',
  },
  {
    name: 'option statements written without semicolons, spliced before base code (F21)',
    base: 'import { useK } from \'./p\';\n\nexport const C = () => {\n  const y = useK();\n  [y.k].forEach(log);\n};\n',
    option: 'export const useK = () => {\n  const k = 1\n\n  return { k }\n}\n',
    expected: 'export const C = () => {\n  const k = 1;\n  [k].forEach(log);\n};\n',
  },
  {
    name: 'a comment directive as the last line of a block',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  log(x);\n  // @lintel:comment ./p#note\n};\n',
    option: 'export const note = \'Why this is so.\';\nexport const x = 1;\n',
    expected: 'export const run = () => {\n  log(1);\n  // Why this is so.\n};\n',
  },
  {
    name: 'a name the base imports as a type and an option as a value, written as a value only',
    base: 'import type { Thing } from \'lib\';\nimport { v } from \'./p\';\n\nexport const a: Thing = v;\n',
    option: 'import { Thing } from \'lib\';\n\nexport const v = Thing;\n',
    expected: 'import { Thing } from \'lib\';\n\nexport const a: Thing = Thing;\n',
  },
  {
    name: 'a name the base marks type inside a value import and an option reads as a value',
    base: 'import { other, type Thing } from \'lib\';\nimport { v } from \'./p\';\n\n'
      + 'export const a: Thing = other(v);\n',
    option: 'import { Thing } from \'lib\';\n\nexport const v = Thing;\n',
    expected: 'import { other, Thing } from \'lib\';\n\nexport const a: Thing = other(Thing);\n',
  },
  {
    name: 'an import with attributes, kept',
    base: 'import data from \'./data.json\' with { type: \'json\' };\nimport { v } from \'./p\';\n\n'
      + 'export const a = data.x + v;\n',
    option: 'export const v = 1;\n',
    expected: 'import data from \'./data.json\' with { type: \'json\' };\n\nexport const a = data.x + 1;\n',
  },
  {
    name: 'several kinds in one base, each by its rule',
    base: [
      'import { Extra, LIMIT, make, table } from \'./p\';',
      '',
      'export interface Props extends Extra {',
      '  readonly name: string;',
      '}',
      '',
      'export const all = [make(), table.size, LIMIT];',
      '',
    ].join('\n'),
    option: [
      'export interface Extra {',
      '  readonly more: number;',
      '}',
      '',
      'export const LIMIT = 9;',
      'export const make = () => 4;',
      'export const table = { size: 2 };',
      '',
    ].join('\n'),
    expected: [
      'export interface Props {',
      '  readonly name: string;',
      '  readonly more: number;',
      '}',
      '',
      'export const all = [4, 2, 9];',
      '',
    ].join('\n'),
  },
  {
    name: 'a key onto a root that closes itself',
    base: 'import { Rule } from \'./p\';\n\nexport const line = <Rule key="k" />;\n',
    option: 'export const Rule = () => <hr />;\n',
    expected: 'export const line = <hr key="k" />;\n',
  },
  {
    name: 'statements into a block no function owns',
    base: 'import { useThing } from \'./p\';\n\n{\n  const thing = useThing();\n\n  log(thing.value);\n}\n',
    option: 'export const useThing = () => {\n  const value = 1;\n\n  return { value };\n};\n',
    expected: '{\n  const value = 1;\n\n  log(value);\n}\n',
  },
  {
    name: 'the imports the composed body reads, grouped and ordered',
    base: [
      'import fs, { readFileSync as read } from \'node:fs\';',
      'import * as path from \'node:path\';',
      'import { unused } from \'node:os\';',
      'import { scoped } from \'@scope/pkg\';',
      'import { pkg } from \'pkg\';',
      'import { x } from \'./p\';',
      'import \'./side.css\';',
      '',
      'import type { Shape } from \'./types\';',
      '',
      'export const y: Shape = [fs, read, path, scoped, pkg, x, b, a];',
      '',
    ].join('\n'),
    option: 'import { b, a } from \'../up\';\n\nexport const x = 1;\n',
    expected: [
      'import fs, { readFileSync as read } from \'node:fs\';',
      'import { unused } from \'node:os\';',
      'import * as path from \'node:path\';',
      '',
      'import { scoped } from \'@scope/pkg\';',
      'import { pkg } from \'pkg\';',
      '',
      'import { a, b } from \'../up\';',
      '',
      'import type { Shape } from \'./types\';',
      '',
      'import \'./side.css\';',
      '',
      'export const y: Shape = [fs, read, path, scoped, pkg, 1, b, a];',
      '',
    ].join('\n'),
  },
  {
    name: 'what the base opens with, kept above the imports',
    base: [
      '// Why this file.',
      '\'use client\';',
      '',
      'import { a } from \'pkg\';',
      'import { x } from \'./p\';',
      '',
      'export const y = [a, x];',
      '',
    ].join('\n'),
    option: [
      'export const x = 1;',
      '',
    ].join('\n'),
    expected: [
      '// Why this file.',
      '\'use client\';',
      '',
      'import { a } from \'pkg\';',
      '',
      'export const y = [a, 1];',
      '',
    ].join('\n'),
  },
  {
    name: 'what the base opens with, when no import is left',
    base: [
      '\'use client\';',
      '',
      'import { x } from \'./p\';',
      '',
      'export const y = x;',
      '',
    ].join('\n'),
    option: [
      'export const x = 1;',
      '',
    ].join('\n'),
    expected: [
      '\'use client\';',
      '',
      'export const y = 1;',
      '',
    ].join('\n'),
  },
  {
    name: 'more than two names from one module, one per line, a type among them',
    base: [
      'import { c, type B, a } from \'pkg\';',
      'import { x } from \'./p\';',
      '',
      'export const y: B = [a, c, x];',
      '',
    ].join('\n'),
    option: [
      'export const x = 1;',
      '',
    ].join('\n'),
    expected: [
      'import {',
      '  a,',
      '  type B,',
      '  c,',
      '} from \'pkg\';',
      '',
      'export const y: B = [a, c, 1];',
      '',
    ].join('\n'),
  },
  {
    name: 'a last parameter filling leaves unread, dropped whole',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ label }: Props) => <Item label={label} />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = () => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'a parameter filling leaves unread after another, dropped with its comma',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = (ref: Ref, { label }: Props) => <Item label={label} />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = (ref: Ref) => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'a parameter filling leaves unread before another, left as an empty pattern',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ label }: Props, ref: Ref) => <Item label={label} />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = ({}: Props, ref: Ref) => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'a parameter the base already leaves unread, left as written',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ label }: Props, ref: Ref) => <Item />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = ({ label }: Props, ref: Ref) => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'of two names, the one filling leaves unread dropped, the one the base leaves unread kept',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ label, other }: Props) => <Item label={label} />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = ({ other }: Props) => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'a name the base leaves unread, kept though an inner binding of that name is read',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ label }: Props) => [1].map((label) => <Item label={label} />);',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = ({ label }: Props) => [1].map((label) => <li />);',
      '',
    ].join('\n'),
  },
  {
    name: 'code no option touched, left as written though a rule would simplify it',
    base: [
      'import { x } from \'./p\';',
      '',
      'export const y = [x, true ? 1 : 2, ({ a: 1 }).a, { ...{ b: 1 } }];',
      'export const Z = ({ ...r }) => <div {...r} c={undefined}><><b {...{ d: 1 }} e={undefined} /></></div>;',
      '',
    ].join('\n'),
    option: 'export const x = 1;\n',
    expected: [
      'export const y = [1, true ? 1 : 2, ({ a: 1 }).a, { ...{ b: 1 } }];',
      'export const Z = ({ ...r }) => <div {...r} c={undefined}><><b {...{ d: 1 }} e={undefined} /></></div>;',
      '',
    ].join('\n'),
  },
  {
    name: 'code filling wrote into, simplified',
    base: [
      'import { on } from \'./p\';',
      '',
      'export const y = [on ? 1 : 2, ({ a: on }).a];',
      '',
    ].join('\n'),
    option: 'export const on = true;\n',
    expected: 'export const y = [1, true];\n',
  },
  {
    name: 'filled code written like the author code beside it, simplified, the author code left',
    base: [
      'import { on } from \'./p\';',
      '',
      'export const y = [on, true ? 1 : 2];',
      'export const z = <p>{on}{true ? 1 : 2}</p>;',
      '',
    ].join('\n'),
    option: 'export const on = true ? 1 : 2;\n',
    expected: [
      'export const y = [1, true ? 1 : 2];',
      'export const z = <p>{1}{true ? 1 : 2}</p>;',
      '',
    ].join('\n'),
  },
  {
    name: 'of two bindings of one name, the base\'s that filling leaves unread dropped, the option\'s kept',
    base: [
      'import { Item, row } from \'./p\';',
      '',
      'export const a = [row, ({ id }: P) => <Item id={id} />];',
      'export const b = [({ id }: P) => <Item id={id} />, row];',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      'export const row = ({ id }: P) => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const a = [({ id }: P) => <li />, () => <li />];',
      'export const b = [() => <li />, ({ id }: P) => <li />];',
      '',
    ].join('\n'),
  },
  {
    name: 'a pattern with a default, left as written',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ label = make(), other }: Props) => <Item />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = () => <li />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = ({ label = make(), other }: Props) => <li />;',
      '',
    ].join('\n'),
  },
  {
    name: 'a rest binding, replaced by the names the option component reads from it',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ name, ...rest }: Props) => <Item {...rest} title={name} />;',
      '',
    ].join('\n'),
    option: [
      'export const Item = ({ title, current }: P) => <li title={title} hidden={current} />;',
      '',
    ].join('\n'),
    expected: [
      'export const List = ({ name, current }: Props) => <li title={name} hidden={current} />;',
      '',
    ].join('\n'),
  },
  {
    name: 'an import filling leaves only spelled as a key, dropped',
    base: [
      'import { size } from \'pkg\';',
      'import { Item } from \'./p\';',
      '',
      'export const y = { size: <Item size={size} /> };',
      '',
    ].join('\n'),
    option: 'export const Item = () => <li />;\n',
    expected: 'export const y = { size: <li /> };\n',
  },
  {
    name: 'an import the base never reads, kept',
    base: [
      'import { size } from \'pkg\';',
      'import { x } from \'./p\';',
      '',
      'export const y = { size: x };',
      '',
    ].join('\n'),
    option: 'export const x = 1;\n',
    expected: 'import { size } from \'pkg\';\n\nexport const y = { size: 1 };\n',
  },
];

const MORE_REFUSALS: Refusal[] = [
  {
    name: 'an attribute written before a rest spread (F15)',
    base: 'import { Card } from \'./p\';\n\nexport const A = ({ id, ...rest }: Props) => '
      + '<Card title="mine" {...rest}>{id}</Card>;\n',
    option: 'export const Card = ({ title, children }: P) => <h1 title={title}>{children}</h1>;\n',
    message: /"title" is written before the rest spread, which may give the component its own/u,
  },
  {
    name: 'an attribute string holding entities (F14)',
    base: 'import { Card } from \'./p\';\n\nexport const A = () => {\n'
      + '  return <Card title="a&amp;b &lt; c">x</Card>;\n};\n',
    option: 'export const Card = ({ title }: { title: string }) => {\n  return <h1>{title}</h1>;\n};\n',
    message: /An attribute string holding "&" or a line break means another text as a JS string: title="a&amp;/u,
  },
  {
    name: 'a parameter module named by a dynamic import (F22)',
    base: 'import { v } from \'./p\';\n\nexport const a = v;\nexport const lazy = () => import(\'./p\');\n',
    option: 'export const v = 1;\n',
    message: /A parameter module is named where nothing fills it, so its option would be lost: import\('\.\/p'\)/u,
  },
  {
    name: 'an option export a destructuring assignment writes',
    base: 'import { v } from \'./p\';\n\nexport const f = () => {\n  [v] = [2];\n  ({ v } = { v: 3 });\n};\n',
    option: 'export const v = 1;\n',
    message: /must be a constant with no effect, never written: \[v\]/u,
  },
  {
    name: 'a comment directive whose note holds a line feed',
    base: 'import { v } from \'./p\';\n\n// @lintel:comment ./p#note\nexport const x = v;\n',
    option: 'export const v = 1;\nexport const note = \'hi\\nprocess.exit(1);\';\n',
    message: /\.\/p#note holds a line break, which would end the comment and write code\./u,
  },
  {
    name: 'a comment directive whose note holds a carriage return',
    base: 'import { v } from \'./p\';\n\n// @lintel:comment ./p#note\nexport const x = v;\n',
    option: 'export const v = 1;\nexport const note = \'hi\\rprocess.exit(1);\';\n',
    message: /holds a line break/u,
  },
  {
    name: 'a comment directive whose note holds a line separator',
    base: 'import { v } from \'./p\';\n\n// @lintel:comment ./p#note\nexport const x = v;\n',
    option: 'export const v = 1;\nexport const note = \'hi\\u2028process.exit(1);\';\n',
    message: /holds a line break/u,
  },
  {
    name: 'a comment directive written inside a template literal',
    base: 'import { v } from \'./p\';\n\nexport const a = `\n// @lintel:comment ./p#note\n` + v;\n',
    option: 'export const v = 1;\nexport const note = \'hi\';\n',
    message: /is left after composing: @lintel:/u,
  },
  {
    name: 'a comment directive written as JSX text',
    base: 'import { v } from \'./p\';\n\nexport const A = () => {\n  return <p>\n    // @lintel:comment ./p#note\n'
      + '    {v}\n  </p>;\n};\n',
    option: 'export const v = 1;\nexport const note = \'hi\';\n',
    message: /is left after composing: @lintel:/u,
  },
  {
    name: 'a module the base and an option import whole under two names',
    base: 'import React from \'react\';\nimport { v } from \'./p\';\n\nexport const a = [React, v];\n',
    option: 'import R from \'react\';\n\nexport const v = R;\n',
    message: /react is imported whole as "React" and as "R"; import it under one name/u,
  },
  {
    name: 'a type read as a value',
    base: 'import { Extra } from \'./p\';\n\nexport const y = Extra;\n',
    option: 'export interface Extra {\n}\n',
    message: /must be a constant with no effect/u,
  },
  {
    name: 'a declaration with no value read as one',
    base: 'import { later } from \'./p\';\n\nexport const y = later;\n',
    option: 'export let later: number;\n',
    message: /must be a constant with no effect/u,
  },
  {
    name: 'a value an interface extends',
    base: 'import { x } from \'./p\';\n\nexport interface Props extends x {\n}\n',
    option: 'export const x = 1;\n',
    message: /must be an interface, a type literal or Record<never, never>/u,
  },
  {
    name: 'an attribute that is an element',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item icon=<b /> />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /must be a string or an expression/u,
  },
  {
    name: 'a spread of something that is not a name',
    base: 'import { Item } from \'./p\';\n\nexport const list = <Item {...a.b} />;\n',
    option: 'export const Item = () => <li />;\n',
    message: /Only a rest binding can be spread/u,
  },
  {
    name: 'a comment directive naming a type',
    base: 'import { x } from \'./p\';\n\nexport const run = () => {\n  // @lintel:comment ./p#Note\n  return x;\n};\n',
    option: 'export interface Note {\n}\nexport const x = 1;\n',
    message: /\.\/p#Note must be a string/u,
  },
  {
    name: 'a comment directive that shares its line with code',
    base: 'import { x } from \'./p\';\n\nexport const y = x; // @lintel:comment ./p#note\n',
    option: 'export const x = 1;\n',
    message: /is left after composing: @lintel:/u,
  },
  {
    name: 'a name the option component reads from the rest binding, bound by the base too',
    base: [
      'import { Item } from \'./p\';',
      '',
      'export const List = ({ ...rest }: Props) => [1].map((current) => <Item key={current} {...rest} />);',
      '',
    ].join('\n'),
    option: [
      'export const Item = ({ current }: P) => <li hidden={current} />;',
      '',
    ].join('\n'),
    message: /reads "current" from "rest", and the base binds that name too/u,
  },
  {
    name: 'inlined code that reads a helper its option module keeps',
    base: [
      'import { x } from \'./p\';',
      '',
      'export const y = x();',
      '',
    ].join('\n'),
    option: [
      'const helper = 1;',
      '',
      'export const x = () => helper;',
      '',
    ].join('\n'),
    message: /"helper" is declared in an option module and read by code that left it behind/u,
  },
  {
    name: 'statements that bind a name the base imports',
    base: [
      'import { join } from \'node:path\';',
      'import { useThing } from \'./p\';',
      '',
      'export const run = () => {',
      '  const thing = useThing();',
      '',
      '  return join(thing.value);',
      '};',
      '',
    ].join('\n'),
    option: [
      'export const useThing = () => {',
      '  const join = 1;',
      '  const value = join;',
      '',
      '  return { value };',
      '};',
      '',
    ].join('\n'),
    message: /The option's statements declare "join", which the base reads from outside the block/u,
  },
  {
    name: 'a composed text that is no longer a module',
    base: [
      'import { x } from \'./p\';',
      '',
      'export const y = <x.Item />;',
      '',
    ].join('\n'),
    option: [
      'export const x = { Item: () => <li /> };',
      '',
    ].join('\n'),
    message: /The composed module does not parse/u,
  },
];

describe('moduleCompose, one rule at a time', () => {
  it.each([...CASES, ...MORE_CASES])('fills $name', ({
    base,
    option,
    expected,
  }) => {
    const composed = moduleCompose({
      base,
      options: { './p': option },
      modules: {},
      plainData: [],
      pureCalls: [],
    });

    expect(composed).toBe(expected);
  });
});

describe('moduleCompose, on option modules that import each other', () => {
  it('refuses them, naming the ring, before it fills anything', () => {
    const run = (): string => {
      return moduleCompose({
        base: 'import { a } from \'./p\';\n\nexport const x = a;\n',
        options: {
          './p': 'import { b } from \'./q\';\nexport const a = { x: b, y: b };\n',
          './q': 'import { a } from \'./p\';\nexport const b = { x: a, y: a };\n',
        },
        modules: {},
        plainData: [],
        pureCalls: [],
      });
    };

    expect(run).toThrow('Option modules import each other in a ring, so filling them never ends: ./p -> ./q -> ./p');
  });
});

describe('moduleCompose, on an option module outside the base\'s directory', () => {
  it('refuses it', () => {
    const run = (): string => {
      return moduleCompose({
        base: 'import { a } from \'../shared/p\';\n\nexport const x = a;\n',
        options: { '../shared/p': 'export const a = 1;\n' },
        modules: {},
        plainData: [],
        pureCalls: [],
      });
    };

    expect(run).toThrow('An option module must sit in the base\'s own directory, imported as ./<name>: ../shared/p');
  });
});

describe('moduleCompose, refusing', () => {
  it.each([...REFUSALS, ...MORE_REFUSALS])('refuses $name', ({
    base,
    option,
    message,
  }) => {
    const run = (): string => {
      return moduleCompose({
        base,
        options: { './p': option },
        modules: {},
        plainData: [],
        pureCalls: [],
      });
    };

    expect(run).toThrow(message);
  });
});
