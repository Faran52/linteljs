import { withoutClaudePaths } from './frontmatterUtils';

describe('withoutClaudePaths', () => {
  it('drops the paths frontmatter that opens a rule', () => {
    const actual = withoutClaudePaths('---\npaths:\n  - "src/**"\n  - "lib/**"\n---\n\n# Rule\n');
    expect(actual).toBe('# Rule\n');
  });

  it('keeps a paths block that does not open the file', () => {
    const source = '# T\n\n---\npaths:\n  - "a"\n---\n\nbody';

    const actual = withoutClaudePaths(source);
    expect(actual).toBe(source);
  });
});
