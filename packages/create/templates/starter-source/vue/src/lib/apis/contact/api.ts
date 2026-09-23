import { type ContactValues, validateContact } from './schemas';

export interface ContactResult {
  status: number;
}

/*
 * Local, and touching no network. A starter that posted somewhere would fail offline, fail in CI, and fail in the
 * five targets that have no server at all; what is worth demonstrating is the layer, not the request.
 *
 * `services/` would be the home for domain logic. This is `apis/` because it is the edge: the one place that
 * would speak HTTP if there were any.
 */
export const submitContact = async (values: ContactValues): Promise<ContactResult> => {
  const errors = validateContact(values);

  if (Object.keys(errors).length > 0) {
    throw new Error('Contact details are not valid');
  }

  return await Promise.resolve({ status: 200 });
};

/*
 * One shape whatever the data answer is, so the form takes a submit and never knows which layer runs it. With no
 * data layer there is nothing to wrap, so this is the function itself.
 */
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return submitContact;
};
