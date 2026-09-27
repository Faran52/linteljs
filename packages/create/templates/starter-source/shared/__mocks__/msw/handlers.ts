import { http, HttpResponse } from 'msw';

// A test that wants a different answer overrides a handler rather than mocking the module underneath.
export const handlers = [
  http.get('/api/version', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
