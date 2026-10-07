import { withWorkerStart } from './workerStartUtils';

describe('withWorkerStart', () => {
  it('ends the source with the start', () => {
    const start = withWorkerStart({
      entries: [],
      code: 'start();',
    });
    const actual = start("import { a } from 'a';\n\nrun(a);\n");
    expect(actual).toBe("import { a } from 'a';\n\nrun(a);\n\nstart();\n");
  });

  it('puts its imports above the first', () => {
    const start = withWorkerStart({
      entries: [],
      imports: "import { dev } from 'dev';\n",
      code: 'start();',
    });
    const actual = start("import { a } from 'a';\n");
    expect(actual).toBe("import { dev } from 'dev';\nimport { a } from 'a';\n\nstart();\n");
  });
});
