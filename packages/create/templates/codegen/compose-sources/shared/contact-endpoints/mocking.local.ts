import type { submitContact as SubmitContact } from './contactEndpoints';

export const mocking = {
  accepts: 'answers 200 for details the rules accept',
  refuses: 'refuses details the rules refuse',
  refusal: 'Contact details are not valid',
};

export const mockingCases = (submitContact: typeof SubmitContact): void => {};
