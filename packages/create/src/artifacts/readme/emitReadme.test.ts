import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '../../model/answers/answers';

import { emitReadme } from './emitReadme';

describe('emitReadme', () => {
  it('fills the project name and target label into the template', () => {
    const template = '# {{PROJECT_NAME}}\n\n{{TARGET_LABEL}} project.\n';

    expect(emitReadme(template, 'demo-app', {
      ...DEFAULT_ANSWERS,
      target: 'react',
    })).toBe(
      '# demo-app\n\nReact (Vite) project.\n',
    );
  });

  it('fills the run prefix and check chain', () => {
    const template = 'run: {{RUN}} check\n\n{{CHECK_CHAIN}}\n';

    expect(emitReadme(template, 'demo-app', DEFAULT_ANSWERS)).toContain('run: pnpm check');
  });

  it('throws naming README.md when a slot the template needs is missing from what sharedSlots provides', () => {
    expect(() => {
      return emitReadme('{{NOT_A_REAL_SLOT}}', 'demo-app', DEFAULT_ANSWERS);
    }).toThrow(
      'README.md template has unfilled slots: {{NOT_A_REAL_SLOT}}',
    );
  });
});
