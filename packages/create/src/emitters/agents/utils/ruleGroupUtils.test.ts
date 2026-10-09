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
  type RuleGroup,
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

const alone = (answers: Answers): Pick<RuleGroup, 'answers' | 'directories'> => {
  const group = {
    answers: [answers],
    directories: ['.'],
  };

  return group;
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
    ['es-toolkit', { libraries: ['es-toolkit'] }],
    ['tanstack-query', { data: 'tanstack-query' }],
    ['rtk-query', { data: 'rtk-query' }],
    ['tanstack-router', { router: 'tanstack-router' }],
    ['react-router', { router: 'react-router' }],
    ['react-router-framework', { router: 'react-router-framework' }],
  ])('reads the %s condition off the answers', (condition, answers) => {
    const source = `kept\ngated <!-- when ${condition} -->`;

    const gated = alone(answersFor(answers));

    const actual = forAnswers(gated, source);
    expect(actual).toBe('kept\ngated');
    const opposite = answers.store === undefined ? answersFor({ store: 'zustand' }) : answersFor();

    const without = alone({
      ...opposite,
      libraries: [],
      surfaces: [],
    });

    const ungated = forAnswers(without, source);
    expect(ungated).toBe('kept');
  });

  it('keeps a line every project writes as it is', () => {
    const source = 'a <!-- when store -->\nb <!-- when no-store -->';
    const stores = {
      answers: [answersFor({ store: 'zustand' }), answersFor({ store: 'pinia' })],
      directories: ['apps/web', 'apps/site'],
    };

    const actual = forAnswers(stores, source);
    expect(actual).toBe('a');
  });

  it('names the projects a line holds for when only some of the group write it', () => {
    const source = [
      '- a <!-- when store -->',
      'b <!-- when no-store -->',
      'c <!-- when no-store -->',
      '```',
      '  d <!-- when no-store -->',
      '  e <!-- when no-store -->',
      '```',
      'f <!-- when msw -->',
    ].join('\n');
    const mixed = {
      answers: [
        answersFor(),
        answersFor({ store: 'zustand' }),
        answersFor(),
      ],
      directories: [
        'apps/web',
        'apps/site',
        'apps/admin',
      ],
    };

    const actual = forAnswers(mixed, source);
    const expected = [
      '- `apps/site` only: a',
      '`apps/web`, `apps/admin` only: b',
      'c',
      '```',
      '  d',
      '  e  (apps/web, apps/admin only)',
      '```',
    ].join('\n');

    expect(actual).toBe(expected);
  });

  it('treats a marker mid-line as text', () => {
    const line = 'a <!-- when msw --> and more';

    const plain = alone(answersFor());

    const actual = forAnswers(plain, line);
    expect(actual).toBe(line);
  });

  it('refuses a condition no answer decides', () => {
    const defaults = alone(DEFAULT_ANSWERS);

    expect(() => {
      return forAnswers(defaults, 'line <!-- when sass -->');
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
