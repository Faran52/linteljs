import { runBuild } from '@mocks/runBuild.ts';

import {
  arrowComponentCase,
  asyncReturnHandlerCase,
  awaitedHandlerCase,
  DEFAULT_HOOKS,
  defaultExportFunctionCase,
  detachedHandlerCase,
  expressionBodyCase,
  functionDeclarationCase,
  functionDeclarationComponentCase,
  functionExpressionCase,
  hookOrderCase,
  namespaceDestructureCase,
  propertyFunctionCase,
  strictAwaitedHandlerCase,
} from './functionShapesUtils.ts';

const ARROW = 'const run = async (a: number): Promise<number> => {\n  return a;\n};\n';

describe('functionDeclarationCase', () => {
  it('rewrites a const arrow as a function declaration', () => {
    const { output } = runBuild(functionDeclarationCase, ARROW);

    expect(output).toBe('async function run(a: number): Promise<number> {\n  return a;\n}\n');
  });

  it.each([
    [
      'no semicolon',
      'const run = () => {\n  return 1;\n}\n',
      'declaration has no semicolon, so the rewrite risks a continuation',
    ],
    [
      'a non-statement parent',
      'for (const run = () => {\n  return 1;\n};;) {}\n',
      'arrow sits where a function declaration is not a statement',
    ],
    [
      '`this`',
      'const run = () => {\n  return this;\n};\n',
      'body uses this/arguments/super/new.target, which the rule declines',
    ],
    [
      'a comment before the body',
      'const run = (/* a */) => {\n  return 1;\n};\n',
      'comment outside the body, which the rebuild cannot carry',
    ],
    [
      'reassignment',
      'let other;\nconst run = () => {\n  return 1;\n};\nother = run;\nrun = other;\n',
      'name is constructed, reassigned or carries a prototype',
    ],
    [
      '`new`',
      'const run = () => {\n  return 1;\n};\nnew run();\n',
      'name is constructed, reassigned or carries a prototype',
    ],
  ])('skips an arrow with %s', (_, source, reason) => {
    const { output, skips } = runBuild(functionDeclarationCase, source, 'file.js');

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual([reason]);
  });

  it('leaves an expression body, a `let`, a typed name and type parameters', () => {
    const sources = [
      'const run = () => 1;\n',
      'let run = () => {\n  return 1;\n};\n',
      'const run: () => number = () => {\n  return 1;\n};\n',
      'const run = <T,>(a: T) => {\n  return a;\n};\n',
    ];
    const outputs = sources
      .map((source) => {
        return runBuild(functionDeclarationCase, source).output;
      });

    expect(outputs).toStrictEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});

describe('functionExpressionCase', () => {
  it('rewrites the arrow alone as a function expression', () => {
    const { output } = runBuild(functionExpressionCase, ARROW);

    expect(output).toBe('const run = async function (a: number): Promise<number> {\n  return a;\n};\n');
  });

  it('passes over a declaration that holds no arrow', () => {
    const { output } = runBuild(functionExpressionCase, `const a = 1;\n${ARROW}`);

    expect(output).toBe('const a = 1;\nconst run = async function (a: number): Promise<number> {\n  return a;\n};\n');
  });

  it('skips a body using `arguments`', () => {
    const source = 'const run = () => {\n  return arguments;\n};\n';
    const { output, skips } = runBuild(functionExpressionCase, source, 'file.js');

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['body uses this/arguments/super/new.target, which the rule declines']);
  });
});

describe('propertyFunctionCase', () => {
  const OBJECT = 'const box = {\n  run: (a) => {\n    return a;\n  },\n};\n';

  it('rewrites a property arrow as a method', () => {
    const { output } = runBuild(propertyFunctionCase(true), OBJECT, 'file.js');

    expect(output).toBe('const box = {\n  run(a) {\n    return a;\n  },\n};\n');
  });

  it('rewrites a property arrow as a function expression', () => {
    const { output } = runBuild(propertyFunctionCase(false), OBJECT, 'file.js');

    expect(output).toBe('const box = {\n  run: function (a) {\n    return a;\n  },\n};\n');
  });

  it('leaves a computed key and skips a comment between key and body', () => {
    const computedSource = 'const box = {\n  [key]: () => {\n    return 1;\n  },\n};\n';
    const commentedSource = 'const box = {\n  run: /* a */ () => {\n    return 1;\n  },\n};\n';
    const computed = runBuild(propertyFunctionCase(true), computedSource, 'file.js');
    const commented = runBuild(propertyFunctionCase(true), commentedSource, 'file.js');

    expect(computed.output).toBeUndefined();
    expect(commented.skips).toStrictEqual(['comment outside the body, which the rebuild cannot carry']);
  });
});

describe('defaultExportFunctionCase', () => {
  it('rewrites a default-exported arrow', () => {
    const { output } = runBuild(defaultExportFunctionCase, 'export default () => {\n  return 1;\n};\n');

    expect(output).toBe('export default function () {\n  return 1;\n};\n');
  });

  it('leaves an expression body and skips `this`', () => {
    const expression = runBuild(defaultExportFunctionCase, 'export default () => 1;\n');
    const hazard = runBuild(defaultExportFunctionCase, 'export default () => {\n  return this;\n};\n', 'file.js');

    expect(expression.output).toBeUndefined();
    expect(hazard.skips).toStrictEqual(['body uses this/arguments/super/new.target, which the rule declines']);
  });

  it('skips an arrow with type parameters', () => {
    const { output, skips } = runBuild(defaultExportFunctionCase, 'export default <T,>(a: T) => {\n  return a;\n};\n');

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['arrow carries type parameters, which the rebuild does not reproduce']);
  });
});

describe('expressionBodyCase', () => {
  it('collapses a lone return, parenthesised', () => {
    const { output } = runBuild(expressionBodyCase, 'const run = () => {\n  return { a: 1 };\n};\n');

    expect(output).toBe('const run = () => ({ a: 1 });\n');
  });

  it('leaves a body of two statements or a bare return', () => {
    const two = runBuild(expressionBodyCase, 'const run = () => {\n  go();\n  return 1;\n};\n');
    const bare = runBuild(expressionBodyCase, 'const run = () => {\n  return;\n};\n');

    expect(two.output).toBeUndefined();
    expect(bare.output).toBeUndefined();
  });

  it('skips `this` and a comment in the body', () => {
    const hazard = runBuild(expressionBodyCase, 'const run = () => {\n  return this;\n};\n', 'file.js');
    const commented = runBuild(expressionBodyCase, 'const run = () => {\n  // a\n  return 1;\n};\n');

    expect(hazard.skips).toStrictEqual(['body uses this/arguments/super, which the rule declines']);
    expect(commented.skips).toStrictEqual(['comment inside the body, which the collapse cannot carry']);
  });
});

describe('detachedHandlerCase', () => {
  it('detaches an awaited statement into a handled promise', () => {
    const { output } = runBuild(detachedHandlerCase('catch'), 'async function run() {\n  await go();\n}\n');

    expect(output).toBe('async function run() {\n  (go()).catch(() => {});\n}\n');
  });

  it('skips a top-level await, a constructor and a comment after `await`', () => {
    const topLevel = runBuild(detachedHandlerCase('catch'), 'await go();\n');
    const constructorSource = 'class A {\n  constructor() {\n    const f = async () => {\n'
      + '      await go();\n    };\n  }\n}\n';
    const constructed = runBuild(detachedHandlerCase('catch'), constructorSource);
    const commented = runBuild(detachedHandlerCase('catch'), 'async function run() {\n  await /* a */ go();\n}\n');

    expect(topLevel.skips).toStrictEqual(['await at module top level, which the rule exempts']);
    expect(constructed.skips).toStrictEqual(['await inside a constructor, which the rule exempts']);
    expect(commented.skips).toStrictEqual(['comment between `await` and its operand']);
  });

  it('leaves a statement with no semicolon', () => {
    const { output } = runBuild(detachedHandlerCase('catch'), 'async function run() {\n  await go()\n}\n');

    expect(output).toBeUndefined();
  });
});

describe('strictAwaitedHandlerCase', () => {
  it('chains a `then` on any awaited operand', () => {
    const { output } = runBuild(strictAwaitedHandlerCase, 'async function run() {\n  const a = await go();\n}\n');

    expect(output).toBe('async function run() {\n  const a = await (go()).then(() => {});\n}\n');
  });

  it('skips a top-level await', () => {
    const { skips } = runBuild(strictAwaitedHandlerCase, 'const a = await go();\n');

    expect(skips).toStrictEqual(['await at module top level, which the rule exempts under strict too']);
  });

  it('skips a comment after `await`', () => {
    const source = 'async function run() {\n  const a = await /* a */ go();\n}\n';
    const { output, skips } = runBuild(strictAwaitedHandlerCase, source);

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['comment between `await` and its operand']);
  });
});

describe('awaitedHandlerCase', () => {
  it('appends the suffix to the awaited operand', () => {
    const { output } = runBuild(awaitedHandlerCase('.catch(fail)'), 'const a = await go();\n');

    expect(output).toBe('const a = await (go()).catch(fail);\n');
  });

  it('skips a comment after `await`', () => {
    const { output, skips } = runBuild(awaitedHandlerCase('.catch(fail)'), 'const a = await /* a */ go();\n');

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['comment between `await` and its operand']);
  });
});

describe('asyncReturnHandlerCase', () => {
  it('catches a returned value in an async function', () => {
    const { output } = runBuild(asyncReturnHandlerCase, 'async function run() {\n  return go();\n}\n');

    expect(output).toBe('async function run() {\n  return (go()).catch(linteljsRejectionProbe);\n}\n');
  });

  it('leaves a sync function and skips a comment after `return`', () => {
    const sync = runBuild(asyncReturnHandlerCase, 'function run() {\n  return go();\n}\n');
    const commented = runBuild(asyncReturnHandlerCase, 'async function run() {\n  return /* a */ go();\n}\n');

    expect(sync.output).toBeUndefined();
    expect(commented.skips).toStrictEqual(['comment between `return` and its argument']);
  });
});

describe('namespaceDestructureCase', () => {
  const NAMESPACE = "import * as ns from 'x';\n";

  it('destructures under the import at module level', () => {
    const { output } = runBuild(namespaceDestructureCase('module'), NAMESPACE);

    expect(output).toBe("import * as ns from 'x';\nconst { linteljsNamespaceProbe } = ns;\n");
  });

  it('destructures at the top of a function body', () => {
    const { output } = runBuild(namespaceDestructureCase('function'), `${NAMESPACE}function run() {}\n`);

    expect(output).toBe(`${NAMESPACE}function run() {\nconst { linteljsNamespaceProbe } = ns;}\n`);
  });

  it('destructures in a block that is not a function body', () => {
    const source = `${NAMESPACE}function run() {}\nif (ok) {}\n`;
    const { output } = runBuild(namespaceDestructureCase('block'), source);

    expect(output).toBe(`${NAMESPACE}function run() {}\nif (ok) {\nconst { linteljsNamespaceProbe } = ns;}\n`);
  });

  it('takes a function whose parameters do not shadow the name', () => {
    const { output } = runBuild(namespaceDestructureCase('function'), `${NAMESPACE}function run(a) {}\n`, 'file.js');

    expect(output).toBe(`${NAMESPACE}function run(a) {\nconst { linteljsNamespaceProbe } = ns;}\n`);
  });

  it('leaves a namespace import inside a module declaration', () => {
    const source = "declare module 'm' {\n  import * as ns from 'x';\n}\n";
    const { output } = runBuild(namespaceDestructureCase('module'), source);

    expect(output).toBeUndefined();
  });

  it('leaves a function that shadows the name, and a file already probed', () => {
    const shadowed = runBuild(namespaceDestructureCase('function'), `${NAMESPACE}function run(ns) {}\n`, 'file.js');
    const probed = runBuild(namespaceDestructureCase('module'), `${NAMESPACE}// linteljsNamespaceProbe\n`);
    const none = runBuild(namespaceDestructureCase('module'), "import { a } from 'x';\n");

    expect(shadowed.output).toBeUndefined();
    expect(probed.output).toBeUndefined();
    expect(none.output).toBeUndefined();
  });
});

describe('hookOrderCase', () => {
  it('writes the dependencies in the order asked for', () => {
    const source = 'useEffect(() => {}, [beta, alpha, gamma]);\n';
    const ascending = runBuild(hookOrderCase(DEFAULT_HOOKS, 'asc'), source);
    const descending = runBuild(hookOrderCase(DEFAULT_HOOKS, 'desc'), source);

    expect(ascending.output).toBe('useEffect(() => {}, [alpha, beta, gamma]);\n');
    expect(descending.output).toBe('useEffect(() => {}, [gamma, beta, alpha]);\n');
  });

  it('sorts numerically', () => {
    const { output } = runBuild(hookOrderCase(DEFAULT_HOOKS, 'asc'), 'useMemo(() => {}, [item10, item2]);\n');

    expect(output).toBe('useMemo(() => {}, [item2, item10]);\n');
  });

  it('skips an array already in order and one holding a comment', () => {
    const sorted = runBuild(hookOrderCase(DEFAULT_HOOKS, 'asc'), 'useEffect(() => {}, [alpha, beta]);\n');
    const commented = runBuild(hookOrderCase(DEFAULT_HOOKS, 'asc'), 'useEffect(() => {}, [beta, /* a */ alpha]);\n');

    expect(sorted.skips).toStrictEqual(['dependency array is already in the order the edit would write']);
    expect(commented.skips).toStrictEqual(['comment inside the range the edit rewrites']);
  });

  it('leaves another callee, a single name and a non-name element', () => {
    const sources = [
      'useState(() => {}, [beta, alpha]);\n',
      'useEffect(() => {}, [beta]);\n',
      'useEffect(() => {}, [beta, a.b]);\n',
      'useEffect(go);\n',
    ];
    const outputs = sources
      .map((source) => {
        const built = runBuild(hookOrderCase(DEFAULT_HOOKS, 'asc'), source);

        return built.output;
      });

    expect(outputs).toStrictEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});

describe('arrowComponentCase', () => {
  it('skips a prop used as a shorthand value', () => {
    const source = 'const Card = ({ title, size }) => {\n  return { title, label: size, x: obj.title };\n};\n';
    const { output, skips } = runBuild(arrowComponentCase, source, 'file.js');

    expect(skips).toStrictEqual(['a prop name is used as an object-literal shorthand value']);
    expect(output).toBeUndefined();
  });

  it('rewrites each reference and leaves keys and members', () => {
    const source = 'const Card = ({ title, size }) => {\n  return go(title, { size: size }, obj.title);\n};\n';
    const { output } = runBuild(arrowComponentCase, source, 'file.js');

    expect(output).toBe('const Card = (linteljsProbeProps) => {\n  return go(linteljsProbeProps.title, '
      + '{ size: linteljsProbeProps.size }, obj.title);\n};\n');
  });

  it('skips a redeclared prop and one that is exported', () => {
    const redeclaredSource = 'const Card = ({ title }) => {\n  return (title) => title;\n};\n';
    const exportedSource = 'const title = 1;\nexport { title };\nconst Card = ({ title }) => {\n  return title;\n};\n';
    const redeclared = runBuild(arrowComponentCase, redeclaredSource, 'file.js');
    const exported = runBuild(arrowComponentCase, exportedSource, 'file.js');

    expect(redeclared.skips).toStrictEqual(['a prop name is redeclared or shadowed inside the function']);
    expect(exported.skips).toStrictEqual(['a prop name is also an export specifier']);
  });

  it.each([
    ['a const', 'const title = 1;'],
    ['a class', 'class title {}'],
    ['a class expression', 'const A = class title {};'],
    ['an array element', 'const [title] = list;'],
    ['a rest element', 'const [...title] = list;'],
    ['a defaulted element', 'const [title = 1] = list;'],
    ['a catch parameter', 'try {} catch (title) {}'],
    ['a function', 'function title() {}'],
    ['a function expression parameter', 'const f = function (title) {};'],
  ])('skips a prop redeclared as %s', (_, statement) => {
    const source = `const Card = ({ title }) => {\n  { ${statement} }\n  return 1;\n};\n`;
    const { output, skips } = runBuild(arrowComponentCase, source, 'file.js');

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['a prop name is redeclared or shadowed inside the function']);
  });

  it('rewrites past other export specifiers and leaves a label', () => {
    const source = "const other = 1;\nexport { other };\nexport { 'a b' as 'c d' } from 'x';\n"
      + 'const Card = ({ title }) => {\n  title: {\n    break title;\n  }\n  return title;\n};\n';
    const { output } = runBuild(arrowComponentCase, source, 'file.js');

    expect(output).toBe("const other = 1;\nexport { other };\nexport { 'a b' as 'c d' } from 'x';\n"
      + 'const Card = (linteljsProbeProps) => {\n  title: {\n    break title;\n  }\n'
      + '  return linteljsProbeProps.title;\n};\n');
  });

  it('leaves a lower-case name, a renamed prop and a body with no reference', () => {
    const sources = [
      'const card = ({ title }) => {\n  return title;\n};\n',
      'const Card = ({ title: heading }) => {\n  return heading;\n};\n',
      'const Card = ({ title }) => {\n  return 1;\n};\n',
      'const Card = (props) => {\n  return props;\n};\n',
      'const Card = ({ title = 1 }) => {\n  return title;\n};\n',
      'const Card = ({ title }) => {\n  return title + linteljsProbeProps;\n};\n',
    ];
    const outputs = sources
      .map((source) => {
        return runBuild(arrowComponentCase, source, 'file.js').output;
      });

    expect(outputs).toStrictEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});

describe('functionDeclarationComponentCase', () => {
  it('rewrites a function component', () => {
    const source = 'function Card({ title }) {\n  return title;\n}\n';
    const { output } = runBuild(functionDeclarationComponentCase, source, 'file.js');

    expect(output).toBe('function Card(linteljsProbeProps) {\n  return linteljsProbeProps.title;\n}\n');
  });

  it('leaves a lower-case function', () => {
    const source = 'function card({ title }) {\n  return title;\n}\n';
    const { output } = runBuild(functionDeclarationComponentCase, source, 'file.js');

    expect(output).toBeUndefined();
  });

  it('leaves an anonymous default export', () => {
    const source = 'export default function ({ title }) {\n  return title;\n}\n';
    const { output } = runBuild(functionDeclarationComponentCase, source, 'file.js');

    expect(output).toBeUndefined();
  });
});
