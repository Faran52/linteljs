import { targetFor } from '#targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { formAnswer } from './formAnswer';

describe('formAnswer', () => {
  it('is keyed form', () => {
    expect(formAnswer.key).toBe('form');
  });

  it('offers react-hook-form only where the target renders with React', () => {
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });
    const vue = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'vue',
    });

    expect(formAnswer.values['react-hook-form'].only(react)).toBe(true);
    expect(formAnswer.values['react-hook-form'].only(vue)).toBe(false);
  });
});
