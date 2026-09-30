import { localesOf } from '@utils/answerUtils';

import type { Answers } from '@config/types';

// One answer each, which keeps a starter a sum rather than a product.
export const hasStore = (answers: Answers): boolean => {
  return answers.store !== undefined;
};

export const hasForm = (answers: Answers): boolean => {
  return answers.form !== undefined;
};

export const hasI18n = (answers: Answers): boolean => {
  return localesOf(answers).length > 0;
};
