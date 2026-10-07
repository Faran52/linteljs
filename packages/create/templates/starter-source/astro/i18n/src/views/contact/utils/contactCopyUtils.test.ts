import { languages } from '@i18n/config';

import { contactCopy } from './contactCopyUtils';

describe('contactCopy', () => {
  it('reads each contact word from the locale files', () => {
    const copy = contactCopy();
    const send = copy.en?.contactSend;

    expect(send).toBe('Send');
  });

  it('carries every language the project offers', () => {
    const copy = contactCopy();
    const offered = languages
      .map(({ id }) => {
        return id;
      });

    const carried = Object.keys(copy);

    expect(carried).toStrictEqual(offered);
  });
});
