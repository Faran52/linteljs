import { answersFor, hostedAnswersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Answers, type HostedAnswers } from '@config/types';

import { DEFAULT_ANSWERS } from '@answers';

import { workspaceOf } from '../../utils/layoutUtils';

import {
  forAnswers,
  ruleGroups,
  ruleSources,
} from './ruleGroupUtils';

const monorepo = (overrides: Partial<HostedAnswers>): HostedAnswers => {
  return hostedAnswersFor({
    ...overrides,
    layout: 'monorepo',
  });
};

const namesOf = (answers: Answers): string[] => {
  return ruleSources(answers)
    .map(({ name }) => {
      return name;
    });
};

describe('forAnswers', () => {
  it.each<[string, Partial<Answers>]>([
    ['store', { store: 'zustand' }],
    ['no-store', {}],
    ['languages', { languages: ['ja'] }],
    ['popup', {}],
    ['background', {}],
    ['devtools-panel', { surfaces: ['devtools-panel'] }],
    ['tailwind', { styling: 'tailwind' }],
    ['msw', { mocking: 'msw' }],
    ['tanstack-query', { data: 'tanstack-query' }],
    ['rtk-query', { data: 'rtk-query' }],
    ['tanstack-router', { router: 'tanstack-router' }],
    ['react-router', { router: 'react-router' }],
    ['react-router-framework', { router: 'react-router-framework' }],
  ])('reads the %s condition off the answers', (condition, answers) => {
    const source = `kept\ngated <!-- when ${condition} -->`;

    const actual = forAnswers([answersFor(answers)], source);
    expect(actual).toBe('kept\ngated');
    const opposite = answers.store === undefined ? answersFor({ store: 'zustand' }) : answersFor();

    const ungated = forAnswers([{
      ...opposite,
      surfaces: [],
    }], source);
    expect(ungated).toBe('kept');
  });

  it('keeps a line any project writes, and the no-store line only when none has a store', () => {
    const source = 'a <!-- when store -->\nb <!-- when no-store -->';

    const mixed = forAnswers([answersFor({ store: 'zustand' }), answersFor()], source);
    expect(mixed).toBe('a');
    const storeless = forAnswers([answersFor(), answersFor()], source);
    expect(storeless).toBe('b');
  });

  it('treats a marker mid-line as text', () => {
    const line = 'a <!-- when msw --> and more';

    const actual = forAnswers([answersFor()], line);
    expect(actual).toBe(line);
  });

  it('refuses a condition no answer decides', () => {
    expect(() => {
      return forAnswers([DEFAULT_ANSWERS], 'line <!-- when sass -->');
    }).toThrow('Unknown rule condition: sass');
  });
});

describe('ruleSources', () => {
  it('gives an app its framework structure, state rules and testing rule', () => {
    const names = namesOf(answersFor({ target: 'react' }));

    expect(names).toEqual([
      'type-standards.md',
      'repo-structure.md',
      'react-state.md',
      'hooks-order.md',
      'testing.md',
    ]);
  });

  it('gives a relaxed untested package with zod its own sources', () => {
    const rules = ruleSources(answersFor({
      target: 'typescript',
      typeSafety: 'relaxed',
      testing: 'none',
      libraries: ['zod'],
    }));

    expect(rules).toEqual([
      {
        name: 'type-standards.md',
        sources: ['fragments/claude-rules/type-standards.md', 'fragments/claude-rules/type-standards.relaxed.md'],
      },
      { name: 'repo-structure.md', sources: ['fragments/claude-rules/repo-structure.package.md'] },
      { name: 'type-standards-zod.md', sources: ['fragments/claude-rules/type-standards-zod.md'] },
    ]);
  });
});

describe('ruleGroups', () => {
  it('keeps a single layout\'s names, unrooted', () => {
    const single = ruleGroups(workspaceOf('acme', [{ name: 'acme', answers: hostedAnswersFor() }]));

    const names = single
      .map(({ name }) => {
        return name;
      });
    expect(names).toEqual(namesOf(DEFAULT_ANSWERS));
    expect(single[1]?.directories).toEqual(['.']);
  });

  it('names and roots a monorepo of one as it will at two', () => {
    const lone = ruleGroups(workspaceOf('acme', [{ name: 'web', answers: monorepo({ target: 'vue' }) }]));

    const names = lone
      .map(({ name }) => {
        return name;
      });
    expect(names).toContain('repo-structure.vue.md');
    expect(names).toContain('testing.vue.md');
    expect(lone[1]?.directories).toEqual(['apps/web']);
  });

  it('keeps one framework copy per framework and one state rule over every project using it', () => {
    const workspace = workspaceOf('acme', [
      { name: 'web', answers: monorepo({ target: 'react', store: 'zustand' }) },
      { name: 'admin', answers: monorepo({ target: 'react' }) },
      { name: 'site', answers: monorepo({ target: 'vue' }) },
      { name: 'shared', answers: monorepo({ target: 'typescript', testing: 'none' }) },
    ]);
    const groups = ruleGroups(workspace);

    const scopes = Object.fromEntries(groups
      .map(({ name, directories }) => {
        const entry = [name, directories] as const;

        return entry;
      }));

    expect(scopes).toEqual({
      'type-standards.md': [
        'apps/web',
        'apps/admin',
        'apps/site',
        'packages/shared',
      ],
      'repo-structure.react.md': ['apps/web', 'apps/admin'],
      'react-state.md': ['apps/web', 'apps/admin'],
      'hooks-order.md': ['apps/web', 'apps/admin'],
      'testing.react.md': ['apps/web', 'apps/admin'],
      'repo-structure.vue.md': ['apps/site'],
      'vue-reactivity.md': ['apps/site'],
      'testing.vue.md': ['apps/site'],
      'repo-structure.package.md': ['packages/shared'],
    });

    const react = groups
      .find(({ name }) => {
        return name === 'repo-structure.react.md';
      });
    const stores = react?.answers
      .map(({ store }) => {
        return store;
      });
    expect(stores).toEqual(['zustand', undefined]);
  });
});
