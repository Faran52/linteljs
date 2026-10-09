import { intersection } from 'es-toolkit';

import { Refused } from '../../errors/refused/refusedError';
import { type Catalog } from '../../read/catalog/catalogReader';
import { type Answered, type Question } from '../../read/manifest/manifestReader';
import { offersCheck, unmetOf } from '../offers/offersCheck';

// The default where offered; else a choice takes the first offer and a multi what is left of its default.
const defaultOf = (question: Question, offers: string[], first: string): string | string[] => {
  const defaults = [question.default].flat();
  const kept = intersection(defaults, offers);

  return question.kind === 'multi' ? kept : kept[0] ?? first;
};

const checkedValue = (question: Question, offers: string[], answered: Answered, value: string): void => {
  const unmet = unmetOf(question, value, answered);

  if (unmet !== undefined) {
    throw new Refused(`--${question.flag} ${value} needs a ${unmet} answer that allows it`);
  }

  if (!offers.includes(value)) {
    throw new Refused(`--${question.flag} ${value} is not offered here; pick from: ${offers.join(', ')}`);
  }
};

// Every given answer the catalog offers, in manifest order, with a default for each question left unanswered.
export const answersCheck = (questions: readonly Question[], catalog: Catalog, given: Answered): Answered => {
  return questions
    .reduce<Answered>((answered, question) => {
      const offers = offersCheck(catalog, question, answered);
      const [first] = offers;
      const value = given[question.key];

      if (first === undefined) {
        if (value !== undefined) {
          throw new Refused(`--${question.flag} is not asked here`);
        }

        return answered;
      }

      const picked = value ?? defaultOf(question, offers, first);

      if (Array.isArray(picked) !== (question.kind === 'multi')) {
        throw new Refused(`--${question.flag} takes ${question.kind === 'multi' ? 'a list' : 'one value'}`);
      }

      const values = [picked].flat();

      for (const each of values) {
        checkedValue(question, offers, answered, each);
      }

      const next: Answered = {
        ...answered,
        [question.key]: picked,
      };

      return next;
    }, {});
};
