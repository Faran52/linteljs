import type { Answers } from '@answers/registry';

// The gates several records read, one answer each, which is what keeps a starter a sum rather than a product.
export const hasStore = (answers: Answers): boolean => {
  return answers.store !== undefined;
};

export const hasForm = (answers: Answers): boolean => {
  return answers.form !== undefined;
};

// The button is what either of them gives the page to press.
export const pressable = (answers: Answers): boolean => {
  return hasStore(answers) || hasForm(answers);
};
