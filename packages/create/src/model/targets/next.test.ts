import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '../answers/answers';

import { next } from './next';

describe('scaffold', () => {
  it('writes the exact argv for the default answers', () => {
    expect(next.scaffold('demo-app', DEFAULT_ANSWERS)).toEqual({
      kind: 'create',
      args: [
        'next-app@latest', 'demo-app',
        '--ts',
        '--no-eslint', '--app', '--src-dir', '--no-agents-md',
        '--no-tailwind',
        '--import-alias', '@/*',
        '--use-pnpm',
        '--skip-install',
        '--yes',
      ],
    });
  });

  it('flags tailwind only when the library is chosen', () => {
    const withTailwind = next.scaffold('demo-app', {
      ...DEFAULT_ANSWERS,
      libraries: ['tailwind'],
    });

    expect(withTailwind.args).toContain('--tailwind');
    expect(withTailwind.args).not.toContain('--no-tailwind');
  });

  it('names whichever package manager the answers carry', () => {
    const spec = next.scaffold('demo-app', {
      ...DEFAULT_ANSWERS,
      packageManager: 'yarn',
    });

    expect(spec.args).toContain('--use-yarn');
  });
});
