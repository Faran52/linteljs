import { useTranslation } from 'react-i18next';

import { Button, TextInput } from '../../components/ui';

import { useContactForm } from './useContactForm';

import type { FC } from 'react';

export const ContactPage: FC = () => {
  const { t } = useTranslation();
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
