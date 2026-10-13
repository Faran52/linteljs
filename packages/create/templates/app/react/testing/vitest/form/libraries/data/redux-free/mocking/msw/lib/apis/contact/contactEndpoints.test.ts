import { http, HttpResponse } from 'msw';

import { server } from '@mocks/msw/node';

import { submitContact } from './contactEndpoints';

describe('submitContact', () => {
  it('posts details the rules accept and answers the reply', async () => {
    const submittedContact = await submitContact({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });
    const expected = { status: 200 };
    expect(submittedContact).toEqual(expected);
  });

  it('throws the refusal of details the rules refuse', async () => {
    const submittedContactPromise = submitContact({
      email: 'not-an-address',
      message: 'short',
    });
    await expect(submittedContactPromise).rejects.toThrow('The request failed with status 422.');
  });

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
});
