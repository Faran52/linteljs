import {
  describe,
  expect,
  it,
} from 'vitest';

import { parseCliArgs } from './argvUtils';

describe('parseCliArgs', () => {
  it('turns --skip-scaffold into a skipped scaffold stage', () => {
    expect(parseCliArgs(['demo-app', '--skip-scaffold']).skip).toEqual(['scaffold']);
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

  it('keeps extra positional arguments for main to reject', () => {
    expect(parseCliArgs(['demo-app', 'extra']).unexpectedArguments).toEqual(['extra']);
    expect(parseCliArgs(['sync', 'extra']).unexpectedArguments).toEqual(['extra']);
  });
});
