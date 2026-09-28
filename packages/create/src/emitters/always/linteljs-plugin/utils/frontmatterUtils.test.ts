import { withoutClaudePaths } from './frontmatterUtils';

describe('withoutClaudePaths', () => {
  it('drops the paths frontmatter that opens a rule', () => {
    expect(withoutClaudePaths('---\npaths:\n  - "src/**"\n  - "lib/**"\n---\n\n# Rule\n')).toBe('# Rule\n');
  });

  it('keeps a paths block that does not open the file', () => {
    const source = '# T\n\n---\npaths:\n  - "a"\n---\n\nbody';

    expect(withoutClaudePaths(source)).toBe(source);
  });
});
