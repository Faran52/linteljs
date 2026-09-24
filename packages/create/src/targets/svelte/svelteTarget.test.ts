import {
  ANSWERED,
  byKey,
  componentStyleGates,
  contactGates,
  type GateRow,
  mswGates,
  NOT_TANSTACK_QUERY,
  PRESSABLE,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITH_FORM,
  WITH_STORE,
  WITHOUT_FORM,
  WITHOUT_STORE,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { FOLDER_ROUTED } from '../constants';
import { sfcNaming } from '../utils/namingUtils';

import { svelteTarget } from './svelteTarget';

describe('svelteTarget', () => {
  it('is the record the svelte answer names', () => {
    expect(svelteTarget.id).toBe('svelte');
  });

  /*
   * SvelteKit loads no global stylesheet by convention, so the root layout importing `../app.css` is the only
   * thing that makes the stylesheet this CLI writes reach the browser. Without it Tailwind is installed,
   * configured, and generating nothing.
   */
  it('names the style entry the root layout imports', () => {
    expect(svelteTarget.styleEntry).toBe('src/app.css');
  });

  // `src/app.html` is SvelteKit's own shell, so there is no `index.html` for this CLI to write.
  it('writes no html entry of its own', () => {
    expect(svelteTarget.htmlEntry).toBeUndefined();
  });

  it('names files the way any SFC target does', () => {
    expect(svelteTarget.naming).toEqual(sfcNaming('svelte', 'routes'));
  });

  // SvelteKit's routes are the directory, so a route folder may be `[id]` or `(group)`.
  it('admits the route segments a file-based router owns', () => {
    expect(svelteTarget.folderNaming).toEqual({ 'src/**/': FOLDER_ROUTED });
  });
});

// Every gated entry and the answers that write it, read off what the entry is for rather than off its gate.
const GATES: GateRow[] = [
  ...mswGates(),
  ...componentStyleGates('mark/Mark', 'button/Button', true),
  ...contactGates(['tanstack-query']),
  // The harness a contact suite mounts its form in, so only a form with tests needs it.
  ['__mocks__/WithData.svelte', [{
    form: ANSWERED,
    testing: ['vitest'],
  }]],
  ['__mocks__/WithExtendedQuery.svelte@tanstack-query', TANSTACK_QUERY],
  ['__mocks__/WithExtendedMutation.svelte@tanstack-query', TANSTACK_QUERY],
  ['__mocks__/ExtendedQueryProbe.svelte@tanstack-query', TANSTACK_QUERY],
  ['__mocks__/ExtendedMutationProbe.svelte@tanstack-query', TANSTACK_QUERY],
  ['src/config/routes.ts', WITHOUT_FORM],
  ['src/config/routes.ts@with-form', WITH_FORM],
  ['src/routes/+page.svelte', WITHOUT_STORE],
  ['src/routes/+page.svelte@with-store', WITH_STORE],
  ['src/routes/contact/+page.svelte', WITH_FORM],
  ['src/routes/contact/useContactForm.ts', WITH_FORM],
  ['src/components/ui/button/Button.svelte', PRESSABLE],
  ['src/components/ui/text-input/TextInput.svelte', WITH_FORM],
  ['src/components/ui/text-input/types.ts', WITH_FORM],
  ['src/lib/hooks/create-extended-query/createExtendedQuery.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/create-extended-mutation/createExtendedMutation.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/DataProvider.svelte', NOT_TANSTACK_QUERY],
  ['src/lib/providers/DataProvider.svelte@tanstack-query', TANSTACK_QUERY],
  ['src/lib/store/counter.ts@tanstack-store', [{ store: ['tanstack-store'] }]],
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['./components/ui/button/Button.css', PRESSABLE],
  ['./components/ui/text-input/TextInput.css', WITH_FORM],
  ['src/routes/page.test.ts', WITHOUT_STORE],
  ['src/routes/page.test.ts@with-store', WITH_STORE],
  ['src/lib/hooks/create-extended-query/createExtendedQuery.test.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/hooks/create-extended-mutation/createExtendedMutation.test.ts@tanstack-query', TANSTACK_QUERY],
];

// `starterSourceEmitter` refuses two spellings of one destination, and each gate is held to what it is for.
describe('the starter gates', () => {
  const walk = walkGates(() => {
    return svelteTarget;
  }, 'svelte');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    expect(byKey(GATES)).toEqual(walk.gated);
  });

  it.each(GATES)('%s', (key, conditions) => {
    expect(walk.mismatchOf(key, conditions)).toBeUndefined();
  });
});
