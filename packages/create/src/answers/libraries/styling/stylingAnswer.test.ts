import { valuesOf } from '@utils/objectUtils';

import { targetFor } from '@targets';

import { ANSWERS, DEFAULT_ANSWERS } from '../../registry';

import { stylingAnswer } from './stylingAnswer';

describe('stylingAnswer', () => {
  it('is keyed styling', () => {
    expect(stylingAnswer.key).toBe('styling');
  });

  // Angular templates have no spread site for `stylex.props`, and React Native reaches it only through a renderer
  // its own maintainers call unready; every other target takes it.
  it.each(valuesOf(ANSWERS.target.values))('offers stylex on %s unless it is angular or react native', (target) => {
    expect(stylingAnswer.values.stylex.only(targetFor({
      ...DEFAULT_ANSWERS,
      target,
    }))).toBe(target !== 'angular' && target !== 'react-native');
  });
});
