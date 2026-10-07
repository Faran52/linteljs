import {
  describe,
  expect,
  it,
} from 'vitest';

import { withOurHooks } from './hookUtils';

describe('withOurHooks', () => {
  it('appends ours after theirs on a shared event, and adds an event only ours has', () => {
    const hooks = withOurHooks([['Before', [{ id: 'theirs' }]]], {
      After: [{ id: 'new' }],
      Before: [{ id: 'ours' }],
    });

    expect(hooks).toStrictEqual({
      After: [{ id: 'new' }],
      Before: [{ id: 'theirs' }, { id: 'ours' }],
    });
  });

  it('drops an event left with no hook', () => {
    const hooks = withOurHooks([['Empty', []], ['Kept', [{ id: 'theirs' }]]], {});

    expect(hooks).toStrictEqual({ Kept: [{ id: 'theirs' }] });
  });
});
