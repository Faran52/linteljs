import { http, HttpResponse } from 'msw';

import { server } from '@mocks/msw/node';

import type { submitContact as SubmitContact } from './contactEndpoints';

export const mocking = {
  accepts: 'posts details the rules accept and answers the reply',
  refuses: 'throws the refusal of details the rules refuse',
  refusal: 'The request failed with status 422.',
};

export const mockingCases = (submitContact: typeof SubmitContact): void => {
  it('throws the refusal of a handler the suite overrides', async () => {
    server.use(http.post('*/api/contact', () => {
      return HttpResponse.json({}, { status: 503 });
    }));

    const submittedContactPromise = submitContact({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });
    await expect(submittedContactPromise).rejects.toThrow('The request failed with status 503.');
  });
};
