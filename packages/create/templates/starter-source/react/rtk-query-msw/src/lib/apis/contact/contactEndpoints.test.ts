import { configureStore } from '@reduxjs/toolkit';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { baseApi } from '../base/baseApi';

import { contactEndpoints } from './contactEndpoints';

import type { ContactValues } from '@services/contact-form/contactFormService';

const submit = async (values: ContactValues) => {
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(baseApi.middleware);
    },
  });

  return await store.dispatch(contactEndpoints.endpoints.submitContact.initiate(values));
};

describe('contactEndpoints', () => {
  it('posts details the rules accept and answers the reply', async () => {
    const { data } = await submit({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });

    const expected = { status: 200 };
    expect(data).toEqual(expected);
  });

  it('answers the refusal of details the rules refuse', async () => {
    const { error } = await submit({
      email: 'not-an-address',
      message: 'short',
    });

    const expected = {
      status: 422,
      data: {
        errors: {
          email: 'contactEmailInvalid',
          message: 'contactMessageShort',
        },
      },
    };
    expect(error).toEqual(expected);
  });
});
