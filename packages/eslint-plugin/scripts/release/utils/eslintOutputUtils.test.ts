import { tmpdir } from 'node:os';

import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  fatalOf,
  type LintResult,
  lintResultOf,
  ruleIdsOf,
} from './eslintOutputUtils.ts';

const printing = (stdout: string, code = 0): string[] => {
  const args = ['-e', `process.stdout.write(${JSON.stringify(stdout)}); process.exitCode = ${String(code)};`];

  return args;
};

describe('lintResultOf', () => {
  it('answers the first result eslint prints', async () => {
    const results = [{ messages: [{ ruleId: 'a' }], output: 'fixed' }, { messages: [] }];
    const stdout = JSON.stringify(results);

    const result = await lintResultOf(printing(stdout), tmpdir());

    expect(result).toEqual(results[0]);
  });

  it('reads the results of a run that exits non-zero for what it reported', async () => {
    const results = [{ messages: [{ ruleId: 'b' }] }];
    const stdout = JSON.stringify(results);

    const result = await lintResultOf(printing(stdout, 1), tmpdir());

    expect(result).toEqual(results[0]);
  });

  it('fails a run that printed nothing, with what it wrote to stderr', async () => {
    const args = ['-e', 'process.stderr.write("config broke"); process.exitCode = 2;'];

    const running = lintResultOf(args, tmpdir());

    await expect(running).rejects.toThrow('eslint produced no parseable output:\nconfig broke');
  });

  it('fails a run that printed only whitespace', async () => {
    const running = lintResultOf(printing('  \n', 2), tmpdir());

    await expect(running).rejects.toThrow(/^eslint produced no parseable output:\n$/u);
  });

  it.each([
    ['an object', '{"messages":[]}'],
    ['an empty array', '[]'],
    ['an array of non-objects', '[null]'],
    ['a result without messages', '[{"output":"x"}]'],
    ['a result whose messages are no list', '[{"messages":"x"}]'],
  ])('fails on %s', async (_label, stdout) => {
    const running = lintResultOf(printing(stdout), tmpdir());

    await expect(running).rejects.toThrow(`eslint did not answer a JSON result array:\n${stdout}`);
  });

  it('previews only the head of an unexpected answer', async () => {
    const stdout = `{"pad":"${'x'.repeat(300)}"}`;

    const running = lintResultOf(printing(stdout), tmpdir());

    await expect(running).rejects.toThrow(`eslint did not answer a JSON result array:\n${stdout.slice(0, 200)}`);
    await expect(running).rejects.not.toThrow(stdout.slice(0, 201));
  });

  it('runs in the directory it is given', async () => {
    const cwd = import.meta.dirname;
    const args = ['-e', 'process.stdout.write(JSON.stringify([{ messages: [], output: process.cwd() }]))'];

    const result = await lintResultOf(args, cwd);

    expect(result.output).toBe(cwd);
  });
});

describe('ruleIdsOf', () => {
  it('lists each message rule id in order, null kept', () => {
    const result: LintResult = { messages: [
      { ruleId: 'b' },
      { ruleId: null },
      { ruleId: 'a' },
    ] };

    const ids = ruleIdsOf(result);

    expect(ids).toEqual([
      'b',
      null,
      'a',
    ]);
  });
});

describe('fatalOf', () => {
  it('keeps only the messages marked fatal', () => {
    const fatal = { ruleId: null, fatal: true };
    const result: LintResult = { messages: [
      { ruleId: 'a' },
      fatal,
      { ruleId: 'b', fatal: false },
    ] };

    const kept = fatalOf(result);

    expect(kept).toEqual([fatal]);
  });
});
