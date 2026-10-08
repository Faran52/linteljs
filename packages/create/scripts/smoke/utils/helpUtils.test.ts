import {
  describe,
  expect,
  it,
} from 'vitest';

import { assertHelp } from './helpUtils.ts';

const HELP = [
  'Usage: create-linteljs [dir] --existing --no-install --seed --skip <stage> --yes, -y --help, -h',
  'Stages: lint, package, standard, install, fix',
  'npx @linteljs/create sync',
].join('\n');

describe('assertHelp', () => {
  it('passes a help text naming every flag, every stage and the sync command', () => {
    expect(() => {
      assertHelp(HELP);
    }).not.toThrow();
  });

  it('fails on a flag only a longer flag spells', () => {
    const help = HELP.replace('--seed', '--seed-file');

    expect(() => {
      assertHelp(help);
    }).toThrow('--help does not mention --seed');
  });

  it('fails on a stage that only appears inside a word', () => {
    const help = HELP.replace('fix', 'prefixed');

    expect(() => {
      assertHelp(help);
    }).toThrow('--help does not mention the fix stage');
  });

  it('fails without the sync command', () => {
    const help = HELP.replace('@linteljs/create sync', 'sync');

    expect(() => {
      assertHelp(help);
    }).toThrow('--help does not mention the sync command');
  });

  it('fails when the package is named without the sync command', () => {
    const help = HELP.replace('@linteljs/create sync', '@linteljs/create');

    expect(() => {
      assertHelp(help);
    }).toThrow('--help does not mention the sync command');
  });
});
