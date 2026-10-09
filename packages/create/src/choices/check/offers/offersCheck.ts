import { keysOf } from '@utils/objectUtils';

import { type AnswerKey, ANSWERS } from '@answers';

import { type Catalog } from '../../read/catalog/catalogReader';
import { type Answered, type Question } from '../../read/manifest/manifestReader';
import { answeredValues, drawersIn } from '../../utils/drawerUtils';

const ALWAYS_OFFERED = new Set<AnswerKey>([
  'target',
  'layout',
  'plugins',
  'typeSafety',
]);

// The first required key the answers so far leave unmet; `*` wants any answer but none.
export const unmetOf = (question: Question, value: string, answered: Answered): AnswerKey | undefined => {
  const requires = question.values[value]?.requires;

  if (requires === undefined) {
    return undefined;
  }

  return keysOf(ANSWERS)
    .find((key) => {
      const wanted = requires[key];

      if (wanted === undefined) {
        return false;
      }

      const given = answeredValues(answered, key);

      return wanted === '*' ? given.length === 0 : !given.includes(wanted);
    });
};

// The values a question offers after the answers so far; empty when it goes unasked, with nothing but none to pick.
export const offersCheck = (catalog: Catalog, question: Question, answered: Answered): string[] => {
  const values = [...keysOf(question.values), ...(question.none === undefined ? [] : ['none'])];
  const drawers = drawersIn(catalog, answered)
    .filter((drawer) => {
      return drawer.key === question.key;
    });

  const has = (value: string): boolean => {
    if (ALWAYS_OFFERED.has(question.key)) {
      return true;
    }

    if (question.key === 'languages' || question.key === 'agents') {
      return catalog[question.key].includes(value);
    }

    return drawers.length > 0 && (value === 'none' || drawers
      .some((drawer) => {
        return drawer.value === value;
      }));
  };

  const offers = values
    .filter((value) => {
      return has(value) && unmetOf(question, value, answered) === undefined;
    });

  return offers
    .some((value) => {
      return value !== 'none';
    })
    ? offers
    : [];
};
