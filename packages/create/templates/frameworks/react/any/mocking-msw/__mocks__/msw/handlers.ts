import { http, HttpResponse } from 'msw';

import items from '../../public/api/items.json';

// A test that wants a different answer overrides a handler rather than mocking the module underneath.
export const handlers = [
  http.get('*/api/items.json', () => {
    return HttpResponse.json(items);
  }),
];
