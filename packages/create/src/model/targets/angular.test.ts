import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '../answers/answers';

import { angular } from './angular';

describe('scaffold', () => {
  it('writes the exact argv for the default answers', () => {
    expect(angular.scaffold('demo-app', DEFAULT_ANSWERS)).toEqual({
      kind: 'dlx',
      args: [
        '@angular/cli@latest', 'new', 'demo-app',
        '--defaults', '--skip-git', '--skip-install',
        '--package-manager', 'pnpm',
        '--style', 'css',
        '--ssr', 'false',
      ],
    });
  });

  it('names whichever package manager the answers carry', () => {
    const spec = angular.scaffold('demo-app', {
      ...DEFAULT_ANSWERS,
      packageManager: 'npm',
    });

    expect(spec.args).toEqual(expect.arrayContaining(['--package-manager', 'npm']));
  });
});
