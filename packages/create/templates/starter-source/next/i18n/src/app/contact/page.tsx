'use client';

import { useTranslations } from 'next-intl';

import { Button, TextInput } from '../../components/ui';

import { useContactForm } from './useContactForm';

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
  } = useContactForm();

  return (
    <main className="page">
      <h1 className="page-title">{t('contact')}</h1>
      <p className="page-lede">{t('contactLede')}</p>

      {sent
        ? (
            <p className="sent" role="status">{t('contactSent')}</p>
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
