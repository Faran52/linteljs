import { localesOf } from '@utils/answerUtils';

import type { Answers } from '@config/types';
import type { StarterFile, StarterTest } from '../types';

// One answer each, which keeps a starter a sum rather than a product.
export const hasStore = (answers: Answers): boolean => {
  return answers.store !== undefined;
};

export const hasForm = (answers: Answers): boolean => {
  return answers.form !== undefined;
};

// A starter with no `when` is always written.
export const starterApplies = (file: StarterFile | StarterTest, answers: Answers): boolean => {
  return file.when === undefined || file.when(answers);
};

export const hasI18n = (answers: Answers): boolean => {
  return localesOf(answers).length > 0;
};
