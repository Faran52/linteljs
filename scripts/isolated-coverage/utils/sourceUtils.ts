import ts from 'typescript';

// Nothing but `export ... from` statements: a barrel has no code, so it needs no suite.
export const isBarrel = (text: string): boolean => {
  const { statements } = ts.createSourceFile('source.ts', text, ts.ScriptTarget.Latest);

  return statements.length > 0 && statements
    .every((statement) => {
      return ts.isExportDeclaration(statement) && statement.moduleSpecifier !== undefined;
    });
};
