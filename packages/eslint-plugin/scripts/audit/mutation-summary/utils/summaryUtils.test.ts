import {
  logLinesFor,
  markdownFor,
  unkilledIn,
} from './summaryUtils.ts';

const mutant = (status: string, line: number, replacement?: string) => {
  const built = {
    mutatorName: 'StringLiteral',
    status,
    location: { start: { line } },
    ...replacement === undefined ? {} : { replacement },
  };
  return built;
};

const reportOf = () => {
  const report = {
    files: {
      'src/b.ts': { mutants: [
        mutant('Killed', 1, '""'),
        mutant('Timeout', 10, '{}'),
        mutant('Survived', 9, 'a|b'),
      ] },
      'src/a.ts': { mutants: [mutant('NoCoverage', 3), mutant('Ignored', 4, 'x')] },
    },
  };
  return report;
};

describe('unkilledIn', () => {
  it('lists every Timeout, Survived and NoCoverage mutant by file, then line', () => {
    const unkilled = unkilledIn(reportOf());

    const expected = [
      {
        at: 'src/a.ts:3',
        status: 'NoCoverage',
        mutator: 'StringLiteral',
        replacement: '',
      },
      {
        at: 'src/b.ts:9',
        status: 'Survived',
        mutator: 'StringLiteral',
        replacement: 'a|b',
      },
      {
        at: 'src/b.ts:10',
        status: 'Timeout',
        mutator: 'StringLiteral',
        replacement: '{}',
      },
    ];
    expect(unkilled).toStrictEqual(expected);
  });

  it.each([
    null,
    'text',
    {},
  ])('refuses %j, which is no report', (value) => {
    expect(() => {
      return unkilledIn(value);
    }).toThrow('not a Stryker mutation report');
  });
});

describe('markdownFor', () => {
  it('writes one escaped table row per mutant under a counted title', () => {
    const unkilled = unkilledIn(reportOf());

    const markdown = markdownFor('create rest', unkilled);

    const expected = [
      '### create rest: 3 not killed',
      '',
      '| file:line | status | mutator | replacement |',
      '| --- | --- | --- | --- |',
      '| `src/a.ts:3` | NoCoverage | StringLiteral | `` |',
      '| `src/b.ts:9` | Survived | StringLiteral | `a\\|b` |',
      '| `src/b.ts:10` | Timeout | StringLiteral | `{}` |',
      '',
    ].join('\n');
    expect(markdown).toBe(expected);
  });

  it('flattens a multi-line replacement onto its row', () => {
    const unkilled = [{
      at: 'src/a.ts:1',
      status: 'Survived',
      mutator: 'BlockStatement',
      replacement: '{\n}',
    }];

    const markdown = markdownFor('t', unkilled);

    expect(markdown).toContain('| `{\\n}` |');
  });

  it('says so when every mutant was killed', () => {
    const markdown = markdownFor('create rest', []);

    expect(markdown).toBe('### create rest\n\nEvery mutant killed.\n');
  });
});

describe('logLinesFor', () => {
  it('prints status, place, mutator and the quoted replacement', () => {
    const unkilled = unkilledIn(reportOf());

    const lines = logLinesFor(unkilled);

    const expected = [
      'NoCoverage src/a.ts:3 StringLiteral -> ""',
      'Survived src/b.ts:9 StringLiteral -> "a|b"',
      'Timeout src/b.ts:10 StringLiteral -> "{}"',
    ];
    expect(lines).toStrictEqual(expected);
  });
});
