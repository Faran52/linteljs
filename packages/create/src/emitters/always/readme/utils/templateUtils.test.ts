import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { fillSlots, sharedSlots } from './templateUtils';

describe('fillSlots', () => {
  it('replaces every slot with its value', () => {
    const filled = fillSlots('{{A}} and {{B}}', {
      A: 'one',
      B: 'two',
    }, 'label');

    expect(filled).toBe('one and two');
  });

  it('replaces a slot repeated more than once', () => {
    expect(fillSlots('{{A}}-{{A}}', { A: 'x' }, 'label')).toBe('x-x');
  });

  it('throws naming the label and every slot left unfilled', () => {
    expect(() => {
      return fillSlots('{{A}} {{B}} {{C}}', { A: 'one' }, 'CLAUDE.md');
    }).toThrow(
      'CLAUDE.md template has unfilled slots: {{B}}, {{C}}',
    );
  });

  it('leaves a template with no slots untouched', () => {
    expect(fillSlots('plain text', {}, 'label')).toBe('plain text');
  });
});

describe('sharedSlots', () => {
  it('names the project, the target label and the package manager run prefix', () => {
    const slots = sharedSlots('demo-app', answersFor({ target: 'react' }));

    expect(slots['PROJECT_NAME']).toBe('demo-app');
    expect(slots['TARGET_LABEL']).toBe('React (Vite)');
    expect(slots['RUN']).toBe('pnpm');
  });

  it('carries the check chain built from the answers', () => {
    expect(sharedSlots('demo-app', answersFor({}))['CHECK_CHAIN']).toContain('lint');
  });

  it('adds the test and coverage rows only when there is a test runner', () => {
    expect(sharedSlots('demo-app', answersFor({ testing: 'vitest' }))['TEST_ROWS'])
      .toContain('| test | `pnpm test` |');

    expect(sharedSlots('demo-app', answersFor({ testing: 'none' }))['TEST_ROWS']).toBe('');
  });
});
