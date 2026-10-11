import { languages } from '@i18n/config';

import { load } from './+layout.server';

const last = languages.at(-1)?.id ?? 'en';

describe('the root layout load', () => {
  it('hands on the language the server hook detected', () => {
    const data = load({ locals: { language: last } });

    expect(data).toEqual({ language: last });
  });
});
