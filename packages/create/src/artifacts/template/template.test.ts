import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type TargetId,
  type Testing,
} from '../../model/answers/answers';

import { fillSlots, sharedSlots } from './template';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
}

describe('fillSlots', () => {
  it('replaces every slot with its value', () => {
    expect(fillSlots('{{A}} and {{B}}', {
      A: 'one',
      B: 'two',
    }, 'label')).toBe('one and two');
  });

  it('replaces a slot repeated more than once', () => {
    expect(fillSlots('{{A}}-{{A}}', { A: 'x' }, 'label')).toBe('x-x');
  });

  it('throws naming the label and every slot left unfilled', () => {
    expect(() => {
      return fillSlots('{{A}} {{B}}', { A: 'one' }, 'CLAUDE.md');
    }).toThrow(
      'CLAUDE.md template has unfilled slots: {{B}}',
    );
  });

  it('leaves a template with no slots untouched', () => {
    expect(fillSlots('plain text', {}, 'label')).toBe('plain text');
  });
});

describe('sharedSlots', () => {
  const answersFor = (overrides: AnswerOverrides): Answers => {
    return {
      ...DEFAULT_ANSWERS,
      ...overrides,
    };
  };

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
