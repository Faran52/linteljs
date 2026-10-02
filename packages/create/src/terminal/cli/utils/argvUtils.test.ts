import {
  describe,
  expect,
  it,
} from 'vitest';

import { argumentError, parseCliArgs } from './argvUtils';

describe('parseCliArgs', () => {
  it('reads --existing as an existing directory', () => {
    expect(parseCliArgs(['--existing']).existing).toBe(true);
    expect(parseCliArgs([]).existing).toBe(false);
  });

  it('turns --no-install into skipping both the install and the fix that needs it', () => {
    expect(parseCliArgs(['demo-app', '--no-install']).skip).toEqual(['install', 'fix']);
  });

  it('carries --seed through for a directory the CLI did not make', () => {
    expect(parseCliArgs(['--existing', '--seed']).seed).toBe(true);
    expect(parseCliArgs(['--existing']).seed).toBe(false);
  });

  it('reads sync as a command rather than a project name', () => {
    const options = parseCliArgs(['sync', '--yes']);

    expect(options.command).toBe('sync');
    expect(options.name).toBe('');
    expect(options.yes).toBe(true);
  });

  it('no longer knows --force', () => {
    const parsing = (): ReturnType<typeof parseCliArgs> => {
      return parseCliArgs(['sync', '--force']);
    };

    expect(parsing).toThrow("Unknown option '--force'");
  });

  it('lets an answer flag stand in for --yes on create, never on sync', () => {
    const created = parseCliArgs([
      'demo-app',
      '--target',
      'react',
    ]);
    const synced = parseCliArgs([
      'sync',
      '--target',
      'react',
    ]);

    expect(created.yes).toBe(true);
    expect(synced.yes).toBe(false);
  });

  it('keeps a stage name it does not know, rather than dropping it', () => {
    const options = parseCliArgs([
      'demo-app',
      '--skip',
      'standard',
      '--skip',
      'nonsense',
    ]);

    expect(options.skip).toEqual(['standard']);
    expect(options.unknownSkips).toEqual(['nonsense']);
  });

  it('reports nothing unknown for a valid skip list', () => {
    expect(parseCliArgs([
      'demo-app',
      '--skip',
      'standard',
    ]).unknownSkips).toEqual([]);
  });

  it('collects an optional list flag given more than once, or comma-separated', () => {
    expect(parseCliArgs([
      '--surfaces',
      'popup',
      '--surfaces',
      'background',
    ]).answers)
      .toEqual({ surfaces: ['popup', 'background'] });

    expect(parseCliArgs(['--surfaces', 'popup,background']).answers)
      .toEqual({ surfaces: ['popup', 'background'] });
  });

  it('reads an empty list flag as none', () => {
    const { answers } = parseCliArgs(['--libraries', '']);

    expect(answers).toEqual({ libraries: [] });
  });

  it('carries a single answer flag under its answer key, unsplit', () => {
    expect(parseCliArgs([
      '--target',
      'svelte',
      '--type-safety',
      'relaxed',
    ]).answers)
      .toEqual({
        target: 'svelte',
        typeSafety: 'relaxed',
      });
  });

  it('keeps extra positional arguments for main to reject', () => {
    expect(parseCliArgs(['demo-app', 'extra']).unexpectedArguments).toEqual(['extra']);
    expect(parseCliArgs(['sync', 'extra']).unexpectedArguments).toEqual(['extra']);
  });
});

describe('argumentError', () => {
  it.each([
    [
      'an invalid project name',
      ['My-App'],
      'Project name must be',
    ],
    [
      'an extra create argument',
      ['demo-app', 'extra'],
      'Unexpected argument: extra',
    ],
    [
      'extra create arguments',
      [
        'demo-app',
        'extra',
        'more',
      ],
      'Unexpected arguments: extra, more',
    ],
    [
      'an extra sync argument',
      ['sync', 'extra'],
      'Unexpected argument: extra',
    ],
    [
      'every stage it does not know',
      [
        'demo-app',
        '--skip',
        'lnt',
        '--skip',
        'fx',
      ],
      'Not a stage: lnt, fx.',
    ],
  ])('refuses %s', (_case, argv, message) => {
    expect(argumentError(parseCliArgs(argv))?.startsWith(message)).toBe(true);
  });

  it('names the stages it does know beside one it does not', () => {
    expect(argumentError(parseCliArgs(['--skip', 'lnt'])))
      .toContain('Pass one of: lint, package, standard, install, fix.');
  });

  it.each([
    ['a valid name', ['demo-app']],
    ['no name', []],
    ['sync', ['sync']],
  ])('refuses nothing for %s', (_case, argv) => {
    expect(argumentError(parseCliArgs(argv))).toBeUndefined();
  });
});
