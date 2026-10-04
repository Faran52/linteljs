import { t } from '@i18n';

import { Button, TextInput } from '@ui';

import { createContactForm } from './createContactForm';

import type { JSX } from 'solid-js';

export const ContactPage = (): JSX.Element => {
  const form = createContactForm(t);

  return (
    <main class="page">
      <h1 class="page-title">{t('contact')}</h1>
      <p class="page-lede">{t('contactLede')}</p>

      {form.sent()
        ? <p class="sent" role="status">{t('contactSent')}</p>
        : (
            <form novalidate onSubmit={form.onSubmit}>
              <TextInput {...form.fields.email} />
              <TextInput {...form.fields.message} />
              <Button type="submit" disabled={!form.canSubmit()}>{t('contactSend')}</Button>
            </form>
          )}
    </main>
  );
};
