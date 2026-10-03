import { runBuild } from '@mocks/runBuild.ts';

import {
  exportJoinedCase,
  exportTripleCase,
  importBlankLineCase,
  importJoinedCase,
  importTailJoinedCase,
  interfaceMembers,
  literalMembers,
  patternBlankLineCase,
  patternGapCase,
  patternJoinedCase,
  typeBelowRuntimeCase,
  typeMembersJoinedCase,
  unionGenericCase,
  unionWithMemberCase,
} from './layoutShapesUtils.ts';

const SPLIT_IMPORT = "import {\n  alpha,\n  beta,\n  gamma,\n} from 'x';\n";
const SPLIT_PATTERN = 'const {\n  alpha,\n  beta,\n  gamma,\n} = value;\n';

describe('importJoinedCase', () => {
  it('joins a split import of three onto one line', () => {
    const { output } = runBuild(importJoinedCase, SPLIT_IMPORT);

    expect(output).toBe("import { alpha, beta, gamma, } from 'x';\n");
  });

  it('leaves an import of two or one already on a line', () => {
    const two = runBuild(importJoinedCase, "import {\n  alpha,\n  beta,\n} from 'x';\n");
    const inline = runBuild(importJoinedCase, "import { alpha, beta, gamma } from 'x';\n");

    expect(two.output).toBeUndefined();
    expect(inline.output).toBeUndefined();
  });

  it('skips a range holding a comment', () => {
    const { output, skips } = runBuild(importJoinedCase, "import {\n  alpha, // a\n  beta,\n  gamma,\n} from 'x';\n");

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['comment inside the range the edit rewrites']);
  });
});

describe('importTailJoinedCase', () => {
  it('joins the last two of a fully split import', () => {
    const { output } = runBuild(importTailJoinedCase, SPLIT_IMPORT);

    expect(output).toBe("import {\n  alpha,\n  beta, gamma,\n} from 'x';\n");
  });

  it('needs three named specifiers, each on its own line', () => {
    const two = runBuild(importTailJoinedCase, "import {\n  alpha,\n  beta,\n} from 'x';\n");
    const partly = runBuild(importTailJoinedCase, "import {\n  alpha, beta,\n  gamma,\n} from 'x';\n");

    expect(two.output).toBeUndefined();
    expect(partly.output).toBeUndefined();
  });
});

describe('importBlankLineCase', () => {
  it('opens a blank line after the first specifier', () => {
    const { output } = runBuild(importBlankLineCase, SPLIT_IMPORT);

    expect(output).toBe("import {\n  alpha,\n\n  beta,\n  gamma,\n} from 'x';\n");
  });

  it('needs two named specifiers', () => {
    const { output } = runBuild(importBlankLineCase, "import alpha, {\n  beta,\n} from 'x';\n");

    expect(output).toBeUndefined();
  });
});

describe('patternJoinedCase', () => {
  it('joins a split pattern of three', () => {
    const { output } = runBuild(patternJoinedCase, SPLIT_PATTERN);

    expect(output).toBe('const { alpha, beta, gamma, } = value;\n');
  });

  it('leaves a pattern of two or one on a line', () => {
    const two = runBuild(patternJoinedCase, 'const {\n  alpha,\n  beta,\n} = value;\n');
    const inline = runBuild(patternJoinedCase, 'const { alpha, beta, gamma } = value;\n');

    expect(two.output).toBeUndefined();
    expect(inline.output).toBeUndefined();
  });
});

describe('patternBlankLineCase', () => {
  it('opens a blank line after the first property', () => {
    const { output } = runBuild(patternBlankLineCase, SPLIT_PATTERN);

    expect(output).toBe('const {\n  alpha,\n\n  beta,\n  gamma,\n} = value;\n');
  });

  it('leaves a pattern that is not fully split', () => {
    const { output } = runBuild(patternBlankLineCase, 'const {\n  alpha, beta,\n  gamma,\n} = value;\n');

    expect(output).toBeUndefined();
  });
});

describe('typeMembersJoinedCase', () => {
  it('joins an interface of three members', () => {
    const build = typeMembersJoinedCase('TSInterfaceBody', interfaceMembers);
    const { output } = runBuild(build, 'interface Shape {\n  a: string;\n  b: string;\n  c: string;\n}\n');

    expect(output).toBe('interface Shape { a: string; b: string; c: string; }\n');
  });

  it('joins a type literal of three members', () => {
    const build = typeMembersJoinedCase('TSTypeLiteral', literalMembers);
    const { output } = runBuild(build, 'type Shape = {\n  a: string,\n  b: string,\n  c: string,\n};\n');

    expect(output).toBe('type Shape = { a: string, b: string, c: string, };\n');
  });

  it('skips members held apart by newlines alone', () => {
    const build = typeMembersJoinedCase('TSInterfaceBody', interfaceMembers);
    const { output, skips } = runBuild(build, 'interface Shape {\n  a: string\n  b: string\n  c: string\n}\n');

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['members separated by newlines alone, so joining them would not parse']);
  });

  it('leaves two members, or three on a line', () => {
    const build = typeMembersJoinedCase('TSInterfaceBody', interfaceMembers);
    const two = runBuild(build, 'interface Shape {\n  a: string;\n  b: string;\n}\n');
    const inline = runBuild(build, 'interface Shape { a: string; b: string; c: string }\n');

    expect(two.output).toBeUndefined();
    expect(inline.output).toBeUndefined();
  });
});

describe('patternGapCase', () => {
  const SPLIT_ARRAY = 'const [\n  alpha,\n  beta,\n  gamma,\n] = list;\n';

  it('joins the first gap from the start', () => {
    const { output } = runBuild(patternGapCase('ArrayPattern', true), SPLIT_ARRAY);

    expect(output).toBe('const [\n  alpha, beta,\n  gamma,\n] = list;\n');
  });

  it('joins the last gap from the end', () => {
    const { output } = runBuild(patternGapCase('ObjectPattern', false), SPLIT_PATTERN);

    expect(output).toBe('const {\n  alpha,\n  beta, gamma,\n} = value;\n');
  });

  it('leaves a pattern with a hole or fewer than three', () => {
    const holed = runBuild(patternGapCase('ArrayPattern', true), 'const [\n  alpha,\n  ,\n  gamma,\n] = list;\n');
    const two = runBuild(patternGapCase('ArrayPattern', true), 'const [\n  alpha,\n  beta,\n] = list;\n');

    expect(holed.output).toBeUndefined();
    expect(two.output).toBeUndefined();
  });
});

describe('exportJoinedCase', () => {
  it('joins a split export list of three', () => {
    const source = 'const a = 1;\nconst b = 2;\nconst c = 3;\nexport {\n  a,\n  b,\n  c,\n};\n';
    const { output } = runBuild(exportJoinedCase, source);

    expect(output).toBe('const a = 1;\nconst b = 2;\nconst c = 3;\nexport {\n  a, b, c,\n};\n');
  });

  it('leaves a list of two or one on a line', () => {
    const two = runBuild(exportJoinedCase, 'const a = 1;\nconst b = 2;\nexport {\n  a,\n  b,\n};\n');
    const inline = runBuild(exportJoinedCase, 'const a = 1;\nconst b = 2;\nconst c = 3;\nexport { a, b, c };\n');

    expect(two.output).toBeUndefined();
    expect(inline.output).toBeUndefined();
  });
});

describe('exportTripleCase', () => {
  it('aliases a sole local export twice', () => {
    const { output } = runBuild(exportTripleCase('local'), 'const a = 1;\nexport { a };\n');

    expect(output).toBe('const a = 1;\nexport { a, a as linteljsProbeAlias, a as linteljsProbeAliasTwo };\n');
  });

  it('matches a type export and a re-export by kind', () => {
    const typed = runBuild(exportTripleCase('type'), 'type A = string;\nexport type { A };\n');
    const from = runBuild(exportTripleCase('from'), "export { a } from 'x';\n");
    const wrongKind = runBuild(exportTripleCase('from'), 'const a = 1;\nexport { a };\n');

    const typedExport = 'export type { A, A as linteljsProbeAlias, A as linteljsProbeAliasTwo };\n';

    expect(typed.output).toBe(`type A = string;\n${typedExport}`);
    expect(from.output).toBe("export { a, a as linteljsProbeAlias, a as linteljsProbeAliasTwo } from 'x';\n");
    expect(wrongKind.output).toBeUndefined();
  });

  it('leaves `default`, a list of two, and a file already probed', () => {
    const named = runBuild(exportTripleCase('from'), "export { default } from 'x';\n");
    const two = runBuild(exportTripleCase('local'), 'const a = 1;\nconst b = 2;\nexport { a, b };\n');
    const probed = runBuild(exportTripleCase('local'), 'const a = 1;\nexport { a };\n// linteljsProbeAlias\n');

    expect(named.output).toBeUndefined();
    expect(two.output).toBeUndefined();
    expect(probed.output).toBeUndefined();
  });
});

describe('unionWithMemberCase', () => {
  it('widens an alias into a union', () => {
    const { output } = runBuild(unionWithMemberCase('number'), 'type A = string;\n');

    expect(output).toBe('type A = string | number;\n');
  });

  it('leaves a type whose parent would take the member with it', () => {
    const { output } = runBuild(unionWithMemberCase('number'), 'type A = string[];\n');

    expect(output).toBeUndefined();
  });
});

describe('unionGenericCase', () => {
  it('widens the first type argument into a union of four', () => {
    const { output } = runBuild(unionGenericCase, 'type A = Set<string>;\n');

    expect(output).toBe("type A = Set<string | 'linteljsProbeB' | 'linteljsProbeC' | 'linteljsProbeD'>;\n");
  });

  it('leaves a type argument that is not plain', () => {
    const { output } = runBuild(unionGenericCase, 'type A = Set<string[]>;\n');

    expect(output).toBeUndefined();
  });
});

describe('typeBelowRuntimeCase', () => {
  it('moves a type below the runtime code under imports', () => {
    const source = "import x from 'x';\n\ntype A = string;\nconst a = x;\n";
    const { offset, output } = runBuild(typeBelowRuntimeCase('imports'), source);

    expect(output).toBe("import x from 'x';\n\nconst a = x;\n\ntype A = string;\n");
    expect(offset).toBe("import x from 'x';\n\nconst a = x;\n\n".length);
  });

  it('moves an exported interface in a file with no header', () => {
    const { output } = runBuild(typeBelowRuntimeCase('none'), 'export interface A {\n  a: string;\n}\nconst a = 1;\n');

    expect(output).toBe('const a = 1;\n\nexport interface A {\n  a: string;\n}\n');
  });

  it('writes a directive above a file that has none', () => {
    const source = 'type A = string;\nconst a = 1;\n';
    const { offset, output } = runBuild(typeBelowRuntimeCase('directive'), source);

    expect(output).toBe("'use strict';\n\nconst a = 1;\n\ntype A = string;\n");
    expect(offset).toBe("'use strict';\n\nconst a = 1;\n\n".length);
  });

  it('reads a directive prologue as its own header', () => {
    const source = "'use client';\ntype A = string;\nconst a = 1;\n";
    const asDirective = runBuild(typeBelowRuntimeCase('directive'), source);
    const asNone = runBuild(typeBelowRuntimeCase('none'), source);

    expect(asDirective.output).toBeUndefined();
    expect(asNone.output).toBeUndefined();
  });

  it('needs runtime code to move below', () => {
    const { output } = runBuild(typeBelowRuntimeCase('none'), 'type A = string;\ntype B = number;\n');

    expect(output).toBeUndefined();
  });

  it('skips a type sharing its opening line', () => {
    const { output, skips } = runBuild(typeBelowRuntimeCase('none'), 'const a = 1; type A = string;\n');

    expect(output).toBeUndefined();
    expect(skips).toStrictEqual(['type declaration shares its opening line with other code']);
  });
});
