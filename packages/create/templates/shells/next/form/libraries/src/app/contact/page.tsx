'use client';

import { useTranslations } from 'next-intl';

import { Button, TextInput } from '@ui';

import { useContactForm } from './use-contact-form/useContactForm';
import { styles } from './page.styles';

import type { ReactNode } from 'react';

// A client component: a form is state.
const ContactPage = (): ReactNode => {
  const t = useTranslations();
  const {
    fields,
    sent,
    submitting,
    canSubmit,
    onSubmit,
  } = useContactForm((key) => {
    return t(key);
  });

  return (
    <main {...styles.page}>
      <h1 {...styles.pageTitle}>{t('contact')}</h1>
      <p {...styles.pageLede}>{t('contactLede')}</p>

      {sent
        ? (
            <p {...styles.sent} role="status">{t('contactSent')}</p>
          )
        : (
            <form noValidate onSubmit={onSubmit}>
              <TextInput {...fields.email} />
              <TextInput {...fields.message} />
              <Button type="submit" disabled={!canSubmit || submitting}>{t('contactSend')}</Button>
            </form>
          )}
    </main>
  );
};

export default ContactPage;
