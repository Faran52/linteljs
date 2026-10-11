import { t } from '@i18n/i18n';

import { Button, TextInput } from '@ui';

import { createContactForm } from './create-contact-form/createContactForm';
import { styles } from './ContactPage.styles';

import type { JSX } from 'solid-js';

export const ContactPage = (): JSX.Element => {
  const form = createContactForm(t);

  return (
    <main {...styles.page}>
      <h1 {...styles.pageTitle}>{t('contact')}</h1>
      <p {...styles.pageLede}>{t('contactLede')}</p>

      {form.sent()
        ? <p {...styles.sent} role="status">{t('contactSent')}</p>
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
