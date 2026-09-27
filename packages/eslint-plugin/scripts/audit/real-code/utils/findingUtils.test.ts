import { show } from './findingUtils.ts';

describe('show', () => {
  it('prints the finding and at most 40 indented snippet lines', () => {
    const error = vi.spyOn(console, 'error').mockReturnValue();
    const snippet = Array.from({ length: 45 }, (_, index) => {
      return `line ${String(index)}`;
    }).join('\n');

    show('a.ts', {
      category: 'token loss',
      detail: 'token 3 went missing',
      rules: ['union-newline', 'member-newline'],
    }, snippet, 'minimal reproduction');

    const lines = error.mock.calls.flat().join('\n').split('\n');

    expect(lines.slice(0, 4)).toStrictEqual([
      '[ERROR] token loss: a.ts',
      '  rules: union-newline, member-newline',
      '  token 3 went missing',
      '  minimal reproduction:',
    ]);
    expect(lines.slice(4)).toHaveLength(40);
    expect(lines.at(-1)).toBe('    line 39');
  });
});
