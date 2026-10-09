import { intersection } from 'es-toolkit';

import { type Question } from '../read/manifest/manifestReader';

// What is left of the default once the offers are known.
export const multiDefaultOf = (question: Question, offers: readonly string[]): string[] => {
  const defaults = [question.default].flat();

  return intersection(defaults, offers);
};

// The default where offered, else the first offer.
export const choiceDefaultOf = (question: Question, offers: readonly string[], first: string): string => {
  const [kept = first] = multiDefaultOf(question, offers);

  return kept;
};
