import { configureStore } from '@reduxjs/toolkit';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { baseApi } from '../base/baseApi';

import { contactApi } from './contactEndpoints';

import type { ContactValues } from './schemas';

const submit = async (values: ContactValues) => {
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(baseApi.middleware);
    },
  });

  return await store.dispatch(contactApi.endpoints.submitContact.initiate(values));
};

describe('contactApi', () => {
  it('answers 200 for details the rules accept', async () => {
    const { data } = await submit({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });

    expect(data).toEqual({ status: 200 });
  });

  it('answers a custom error for details the rules refuse', async () => {
    const { error } = await submit({
      email: 'not-an-address',
      message: 'short',
    });

    expect(error).toEqual({
      status: 'CUSTOM_ERROR',
      error: 'Contact details are not valid',
    });
  });
});
