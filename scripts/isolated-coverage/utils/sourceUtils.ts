import ts from 'typescript';

export const isBarrel = (text: string): boolean => {
  const { statements } = ts.createSourceFile('source.ts', text, ts.ScriptTarget.Latest);

  return statements.length > 0 && statements
    .every((statement) => {
      return ts.isExportDeclaration(statement) && statement.moduleSpecifier !== undefined;
    });
};
