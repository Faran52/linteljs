import { http, HttpResponse } from 'msw';

import { type ContactValues, validateContact } from '@services/contact-form/contactFormService';

export const handlers = [
  http.get('/api/version', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Validated here as well as in the form: a server that trusts its client is the defect not to teach.
  http.post('/api/contact', async ({ request }) => {
    const values = await request.json() as ContactValues;
    const errors = validateContact(values);

    if (Object.keys(errors).length > 0) {
      return HttpResponse.json({ errors }, { status: 422 });
    }

    return HttpResponse.json({ status: 'accepted' }, { status: 202 });
  }),
];
