import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import { workspaceOf } from '../../utils/layoutUtils';

import { emitReadme, readmeEmitter } from './readmeEmitter';

import type { Answers, Workspace } from '@config/types';

const workspaceFor = (answers: Answers, name: string): Workspace => {
  return workspaceOf(name, [{
    name,
    answers: {
      ...HOSTED_DEFAULTS,
      ...answers,
    },
  }]);
};

describe('emitReadme', () => {
  it('fills the project name and target label into the template', () => {
    const template = '# {{PROJECT_NAME}}\n\n{{TARGET_LABEL}} project.\n';

    const readme = emitReadme(template, 'demo-app', {
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    expect(readme).toBe(
      '# demo-app\n\nReact (Vite) project.\n',
    );
  });

  it('fills the run prefix and check chain', () => {
    const template = 'run: {{RUN}} check\n\n{{CHECK_CHAIN}}\n';

    const readme = emitReadme(template, 'demo-app', DEFAULT_ANSWERS);
    expect(readme).toContain('run: pnpm check');
  });

  it('throws naming README.md when a slot the template needs is missing from what sharedSlots provides', () => {
    expect(() => {
      return emitReadme('{{NOT_A_REAL_SLOT}}', 'demo-app', DEFAULT_ANSWERS);
    }).toThrow(
      'README.md template has unfilled slots: {{NOT_A_REAL_SLOT}}',
    );
  });
});

describe('readmeEmitter', () => {
  it("replaces the scaffolder's README with one that matches the project", async () => {
    const [artifact] = readmeEmitter(workspaceFor(DEFAULT_ANSWERS, 'demo-app'));
    const scaffolded = '# use npm, yarn or bun\n';
    const readme = artifact === undefined ? '' : await shippedAssetsReader(artifact.content, scaffolded);

    expect(readme).not.toContain('yarn');
    expect(readme).toContain('# demo-app');
    expect(readme).toContain('React (Vite)');
    expect(readme).toContain('`pnpm lint:css`');
    expect(readme).toContain('pnpm lint && pnpm lint:types && pnpm lint:css && pnpm typecheck');
    expect(readme).toContain('`pnpm dlx @linteljs/create sync` rewrites');
  });

  it('adds the native build notes to a react native project only, through its manager', async () => {
    const answers = {
      ...DEFAULT_ANSWERS,
      target: 'react-native' as const,
      packageManager: 'npm' as const,
    };
    const [native] = readmeEmitter(workspaceFor(answers, 'demo-app'));
    const [web] = readmeEmitter(workspaceFor(DEFAULT_ANSWERS, 'demo-app'));
    const nativeReadme = native === undefined ? '' : await shippedAssetsReader(native.content, null);
    const webReadme = web === undefined ? '' : await shippedAssetsReader(web.content, null);

    expect(nativeReadme).toContain('`npx expo run:ios` or `npx expo run:android`');
    expect(nativeReadme).toContain('enableSceneSupport');
    expect(nativeReadme).toContain('gradle-daemon-jvm.properties');
    expect(webReadme).not.toContain('## Native builds');
  });

  it('names no development server for a library', async () => {
    const answers = {
      ...DEFAULT_ANSWERS,
      target: 'typescript' as const,
    };
    const [artifact] = readmeEmitter(workspaceFor(answers, 'demo-lib'));
    const readme = artifact === undefined ? '' : await shippedAssetsReader(artifact.content, null);

    expect(readme).toContain('`package.json`\nis canonical for every other script.');
    expect(readme).not.toContain('server');
  });

  it('lists every project of a workspace in its own section, under the workspace name', async () => {
    const monorepo: Answers = {
      ...DEFAULT_ANSWERS,
      layout: 'monorepo',
    };
    const workspace = workspaceOf('acme', [{
      name: 'web',
      answers: {
        ...HOSTED_DEFAULTS,
        ...monorepo,
      },
    }, {
      name: 'shared',
      answers: {
        ...HOSTED_DEFAULTS,
        ...monorepo,
        target: 'typescript',
      },
    }]);
    const [artifact] = readmeEmitter(workspace);
    const readme = artifact === undefined ? '' : await shippedAssetsReader(artifact.content);

    expect(readme).toContain('# acme\n\nA workspace of 2 projects, scaffolded');
    expect(readme).toContain('### web\n\nReact (Vite), in `apps/web/`.');
    expect(readme).toContain('### shared\n\nTypeScript package, no framework, in `packages/shared/`.');
    expect(readme).toContain('| build | `pnpm --filter shared build` |');
  });
});
