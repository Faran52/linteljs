import { pick } from 'es-toolkit';

import { offersCheck } from '@choices/check/offers/offersCheck';
import { type Catalog } from '@choices/read/catalog/catalogReader';
import { type Answered, type Question } from '@choices/read/manifest/manifestReader';
import { choiceDefaultOf, multiDefaultOf } from '@choices/utils/defaultUtils';
import { type Prompter } from '@terminal';

import { Cancelled } from '../../errors/cancelled/cancelledError';

const answerOf = async (
  prompter: Prompter,
  question: Question,
  offers: readonly string[],
  first: string,
): Promise<string | string[]> => {
  const values = Object.entries(question.values)
    .filter(([value]) => {
      return offers.includes(value);
    })
    .map(([value, described]) => {
      const option = {
        value,
        ...pick(described, ['label', 'hint']),
      };

      return option;
    });
  const none = question.none !== undefined && offers.includes('none')
    ? [{
        value: 'none',
        ...question.none,
      }]
    : [];
  const options = [...values, ...none];

  const asking = question.kind === 'choice'
    ? prompter.select({
        message: question.prompt,
        initialValue: choiceDefaultOf(question, offers, first),
        options,
      })
    : prompter.multiselect({
        message: question.prompt,
        initialValues: multiDefaultOf(question, offers),
        required: false,
        options,
      });
  const answer = await asking;

  if (prompter.isCancel(answer)) {
    throw new Cancelled('Cancelled: nothing was written.');
  }

  return answer;
};

// In manifest order, so each question's offers see the answers before it; a given key is never asked.
export const questionsAsk = async (
  prompter: Prompter,
  questions: readonly Question[],
  catalog: Catalog,
  given: Answered,
): Promise<Answered> => {
  const answered: Answered = { ...given };

  for (const question of questions) {
    if (Object.hasOwn(given, question.key)) {
      continue;
    }

    const offers = offersCheck(catalog, question, answered);
    const [first] = offers;

    if (first !== undefined) {
      answered[question.key] = await answerOf(prompter, question, offers, first);
    }
  }

  return answered;
};
