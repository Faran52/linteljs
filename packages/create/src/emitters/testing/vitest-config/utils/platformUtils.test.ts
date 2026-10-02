import { platformEntries, quoted } from './platformUtils';

describe('quoted', () => {
  it('quotes each value and separates them for an array literal', () => {
    const actual = quoted(['.ios.tsx', '.tsx']);
    expect(actual).toBe("'.ios.tsx', '.tsx'");
  });
});

describe('platformEntries', () => {
  it('writes one platform call per project, each on its own lines', () => {
    const actual = platformEntries([
      {
        name: 'ios',
        extensions: ['.ios.tsx'],
        include: ['src/**/*.test.tsx'],
      },
      {
        name: 'android',
        extensions: ['.android.tsx'],
        include: ['src/**/*.test.tsx'],
      },
    ]);

    const expected = [
      '      platform(',
      "        'ios',",
      "        ['.ios.tsx'],",
      "        ['src/**/*.test.tsx'],",
      '      ),',
      '      platform(',
      "        'android',",
      "        ['.android.tsx'],",
      "        ['src/**/*.test.tsx'],",
      '      ),',
    ].join('\n');
    expect(actual).toBe(expected);
  });

  it('breaks a list of three or more one value per line', () => {
    const actual = platformEntries([{
      name: 'native',
      extensions: [
        '.native.tsx',
        '.tsx',
        '.ts',
      ],
      include: ['src/**/*.test.tsx'],
    }]);

    const expected = [
      '      platform(',
      "        'native',",
      '        [',
      "          '.native.tsx',",
      "          '.tsx',",
      "          '.ts',",
      '        ],',
      "        ['src/**/*.test.tsx'],",
      '      ),',
    ].join('\n');
    expect(actual).toBe(expected);
  });

  it('keeps a list of two on one line', () => {
    const entries = platformEntries([{
      name: 'web',
      extensions: ['.web.tsx', '.tsx'],
      include: ['src/**/*.test.tsx'],
    }]);

    const expected = [
      '      platform(',
      "        'web',",
      "        ['.web.tsx', '.tsx'],",
      "        ['src/**/*.test.tsx'],",
      '      ),',
    ].join('\n');
    expect(entries).toBe(expected);
  });
});
