import { isEqual, uniqWith } from 'es-toolkit';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  ANGULAR_GROUP,
  NEXT_GROUP,
  NUXT_GROUP,
  REACT_GROUP,
  SOLID_GROUP,
  SVELTE_GROUP,
  VUE_GROUP,
} from '../../../eslint-config/src/config/constants';
import { buildGroups } from '../../../eslint-config/src/layers/base/utils/importSortUtils';

import { SUBJECTS } from './constants';
import { shippedCompose } from './shippedCompose';
import {
  ANGULAR_GROUPS,
  EXPO_GROUPS,
  NEXT_GROUPS,
  NUXT_GROUPS,
  PLAIN_GROUPS,
  REACT_GROUPS,
  ROUTER_GROUPS,
  SOLID_GROUPS,
  SVELTE_GROUPS,
  VUE_GROUPS,
} from './subjects/constants';

import type { ImportGroups } from '../utils/importUtils';
import type { Subject, Variant } from './utils/variantUtils';

interface GroupTable {
  name: string;
  table: ImportGroups;
  framework: string[];
  aliases: string[];
}

const SUBJECT: Subject = {
  shell: 'app',
  path: 'src/a.ts',
  base: 'shared/a/a.ts',
  parameters: { './part': { question: 'part' } },
  groups: [['^z$'], ['^a$']],
  plainData: [],
  pureCalls: [],
  modules: {},
};

const VARIANT: Variant = { options: { './part': 'part.one.ts' }, shipped: 'app/part/one/src/a.ts' };

const ACTING_BASE = `import { View } from './part';

export const a = () => {
  return <View>{next()}</View>;
};
`;

const ACTING_OPTION = `import { st } from './a.styles';

export const View = ({ children }: { children: string }) => {
  return <p {...st.tab(1)}>{children}</p>;
};
`;

describe('shippedCompose', () => {
  const readerOf = (sources: Record<string, string>) => {
    const texts = new Map(Object.entries(sources));

    return (name: string): string => {
      const text = texts.get(name);

      if (text === undefined) {
        throw new Error(`no source ${name}`);
      }

      return text;
    };
  };

  it('fills the base with the option beside it, its imports in the subject\'s groups', () => {
    const base = 'import { a } from \'a\';\n\nimport { x } from \'./part\';\n\nexport const y = a(x);\n';
    const option = 'import { z } from \'z\';\n\nexport const x = z;\n';
    const read = readerOf({ 'shared/a/a.ts': base, 'shared/a/part.one.ts': option });

    const composed = shippedCompose(SUBJECT, VARIANT, read);

    expect(composed).toBe('import { z } from \'z\';\n\nimport { a } from \'a\';\n\nexport const y = a(z);\n');
  });

  it('reads a module the subject names from the sources root', () => {
    const read = readerOf({
      'shared/a/a.ts': 'import { x } from \'./part\';\n\nexport const y = x.m;\n',
      'shared/a/part.one.ts': 'import { t } from \'./t\';\n\nexport const x = { m: t.a };\n',
      'tables/t.ts': 'export const t = { a: 1 };\n',
    });

    const composed = shippedCompose({ ...SUBJECT, modules: { './t': 'tables/t.ts' } }, VARIANT, read);

    expect(composed).toBe('import { t } from \'./t\';\n\nexport const y = t.a;\n');
  });

  it('trusts the modules the subject declares plain data and pure calls', () => {
    const read = readerOf({ 'shared/a/a.ts': ACTING_BASE, 'shared/a/part.one.ts': ACTING_OPTION });

    const trusting = {
      ...SUBJECT,
      plainData: ['./a.styles'],
      pureCalls: ['./a.styles'],
    };
    const composed = shippedCompose(trusting, VARIANT, read);

    expect(composed).toContain('<p {...st.tab(1)}>{next()}</p>');
  });

  it.each([
    {
      name: 'plain data',
      plainData: [],
      pureCalls: ['./a.styles'],
    },
    {
      name: 'pure calls',
      plainData: ['./a.styles'],
      pureCalls: [],
    },
  ])('refuses the same subject with no $name', ({ plainData, pureCalls }) => {
    const read = readerOf({ 'shared/a/a.ts': ACTING_BASE, 'shared/a/part.one.ts': ACTING_OPTION });

    const run = (): string => {
      return shippedCompose({
        ...SUBJECT,
        plainData,
        pureCalls,
      }, VARIANT, read);
    };

    expect(run).toThrow('An argument with an effect must run first, and "children" is read after this');
  });
});

const ALIASES = [
  '@config/*',
  '@typings/*',
  '@styles/*',
  '@lib/*',
  '@store/*',
  '@services/*',
  '@providers/*',
  '@apis/*',
  '@utils/*',
  '@i18n/*',
  '@hooks/*',
  '@composables/*',
  '@primitives/*',
  '@ui/*',
  '@features/*',
  '@components/*',
  '@mocks/*',
];

const GROUP_TABLES: GroupTable[] = [
  {
    name: 'PLAIN_GROUPS',
    table: PLAIN_GROUPS,
    framework: [],
    aliases: ALIASES,
  },
  {
    name: 'ANGULAR_GROUPS',
    table: ANGULAR_GROUPS,
    framework: ANGULAR_GROUP,
    aliases: ALIASES,
  },
  {
    name: 'NUXT_GROUPS',
    table: NUXT_GROUPS,
    framework: NUXT_GROUP,
    aliases: ALIASES,
  },
  {
    name: 'SVELTE_GROUPS',
    table: SVELTE_GROUPS,
    framework: SVELTE_GROUP,
    aliases: ALIASES,
  },
  {
    name: 'SOLID_GROUPS',
    table: SOLID_GROUPS,
    framework: SOLID_GROUP,
    aliases: ALIASES,
  },
  {
    name: 'VUE_GROUPS',
    table: VUE_GROUPS,
    framework: VUE_GROUP,
    aliases: ALIASES,
  },
  {
    name: 'REACT_GROUPS',
    table: REACT_GROUPS,
    framework: REACT_GROUP,
    aliases: ALIASES,
  },
  {
    name: 'NEXT_GROUPS',
    table: NEXT_GROUPS,
    framework: NEXT_GROUP,
    aliases: ALIASES,
  },
  {
    name: 'EXPO_GROUPS',
    table: EXPO_GROUPS,
    framework: REACT_GROUP,
    aliases: [...ALIASES, '@/*'],
  },
  {
    name: 'ROUTER_GROUPS',
    table: ROUTER_GROUPS,
    framework: REACT_GROUP,
    aliases: [...ALIASES, '@router/*'],
  },
];

describe('the shipped table', () => {
  it.each(GROUP_TABLES)('groups imports in $name as the base layer does', ({
    table,
    framework,
    aliases,
  }) => {
    const groups = buildGroups(aliases, framework);

    expect(table).toEqual(groups);
  });

  it('trusts no module but the stylex sheets and tokens', () => {
    const declared = SUBJECTS
      .map(({ plainData, pureCalls }) => {
        const trust = { plainData, pureCalls };

        return trust;
      });
    const trusts = uniqWith(declared, isEqual);
    const stylex = { plainData: ['./*.styles', '@styles/tokens.stylex'], pureCalls: ['./*.styles'] };
    const none = { plainData: [], pureCalls: [] };

    expect(trusts).toEqual([stylex, none]);
  });
});
