import {
  describe,
  expect,
  it,
} from 'vitest';

import { parseCliArgs } from './argvUtils';

describe('parseCliArgs', () => {
  // There is no scaffold stage to skip any more: the flag says the directory is a repository that already exists.
  it('reads --skip-scaffold as an existing directory', () => {
    expect(parseCliArgs(['--skip-scaffold']).existing).toBe(true);
    expect(parseCliArgs([]).existing).toBe(false);
  });

  it('turns --no-install into skipping both the install and the fix that needs it', () => {
    // `parseArgs` has no `--no-` negation; the flag is declared under its literal name.
    expect(parseCliArgs(['demo-app', '--no-install']).skip).toEqual(['install', 'fix']);
  });

  it('carries --fresh through for a directory the CLI did not scaffold', () => {
    expect(parseCliArgs(['--skip-scaffold', '--fresh']).fresh).toBe(true);
    expect(parseCliArgs(['--skip-scaffold']).fresh).toBe(false);
  });

  it('reads sync as a command rather than a project name', () => {
    const options = parseCliArgs(['sync', '--force']);

    expect(options.command).toBe('sync');
    expect(options.name).toBe('');
    expect(options.force).toBe(true);
  });

  // Reported and stopped rather than dropped, so the run that happens is the one asked for.
  it('keeps a stage name it does not know, rather than dropping it', () => {
    const options = parseCliArgs(['demo-app', '--skip', 'standard', '--skip', 'nonsense']);

    expect(options.skip).toEqual(['standard']);
    expect(options.unknownSkips).toEqual(['nonsense']);
  });

  it('reports nothing unknown for a valid skip list', () => {
    expect(parseCliArgs(['demo-app', '--skip', 'standard']).unknownSkips).toEqual([]);
  });

  // `surfaces` is the optional list: absent means none, but given it is a list like `libraries`.
  it('collects an optional list flag given more than once, or comma-separated', () => {
    expect(parseCliArgs(['--surfaces', 'popup', '--surfaces', 'background']).answers)
      .toEqual({ surfaces: ['popup', 'background'] });
    expect(parseCliArgs(['--surfaces', 'popup,background']).answers)
      .toEqual({ surfaces: ['popup', 'background'] });
  });

  it('keeps extra positional arguments for main to reject', () => {
    expect(parseCliArgs(['demo-app', 'extra']).unexpectedArguments).toEqual(['extra']);
    expect(parseCliArgs(['sync', 'extra']).unexpectedArguments).toEqual(['extra']);
  });
});
