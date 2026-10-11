import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { targetFor } from '@targets';

import { offeredValuesOf } from './valueUtils';

const refused = (): boolean => {
  return false;
};

describe('offeredValuesOf', () => {
  it('offers every value its own predicate allows, in record order', () => {
    const target = targetFor(DEFAULT_ANSWERS);
    const record = {
      key: 'demo',
      values: {
        open: { label: 'Open' },
        shut: {
          label: 'Shut',
          only: refused,
        },
        kept: {
          label: 'Kept',
          only: () => {
            return true;
          },
        },
      },
    };

    const offered = offeredValuesOf(record, target, DEFAULT_ANSWERS);

    expect(offered).toStrictEqual(['open', 'kept']);
  });

  it('throws when a record offers the target nothing', () => {
    const target = targetFor(DEFAULT_ANSWERS);
    const record = {
      key: 'demo',
      values: {
        shut: {
          label: 'Shut',
          only: refused,
        },
      },
    };

    const offering = () => {
      return offeredValuesOf(record, target, DEFAULT_ANSWERS);
    };

    expect(offering).toThrow(new Error('demo offers no value to react'));
  });
});
