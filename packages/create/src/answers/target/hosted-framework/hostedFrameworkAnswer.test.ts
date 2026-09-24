import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { hostedFrameworkAnswer } from './hostedFrameworkAnswer';

describe('hostedFrameworkAnswer', () => {
  it('is keyed hostedFramework', () => {
    expect(hostedFrameworkAnswer.key).toBe('hostedFramework');
  });

  it('takes a slot on a target that hosts a framework and on no other', () => {
    const astro = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'astro',
    });
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    expect(hostedFrameworkAnswer.slot(astro)).toBe(true);
    expect(hostedFrameworkAnswer.slot(react)).toBe(false);
  });
});
