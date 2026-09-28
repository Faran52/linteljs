import { platformEntries, quoted } from './platformUtils';

describe('quoted', () => {
  it('quotes each value and separates them for an array literal', () => {
    expect(quoted(['.ios.tsx', '.tsx'])).toBe("'.ios.tsx', '.tsx'");
  });
});

describe('platformEntries', () => {
  it('writes one platform call per project, each on its own lines', () => {
    expect(platformEntries([
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
    ])).toBe([
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
    ].join('\n'));
  });
});
