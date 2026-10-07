import { CONTACT_TEXT, type Translate } from '@services/contact-form/contactFormService';

import { Button, TextInput } from '@ui';

import { useContactForm } from './use-contact-form/useContactForm';

import type { FC } from 'react';

const inEnglish: Translate = (key) => {
  return CONTACT_TEXT[key];
};

export const ContactPage: FC = () => {
  const {
    fields,
    sent,
    submitting,
    canSubmit,
    onSubmit,
  } = useContactForm(inEnglish);

  return (
    <main className="page">
      <h1 className="page-title">Contact</h1>
      <p className="page-lede">Two fields, validated on blur. It posts to /api/contact, mocked in dev.</p>

      {sent
        ? (
            <p className="sent" role="status">Thanks. Your message was sent.</p>
          )
        : (
            <form noValidate onSubmit={onSubmit}>
              <TextInput {...fields.email} />
              <TextInput {...fields.message} />
              <Button type="submit" disabled={!canSubmit || submitting}>Send</Button>
            </form>
          )}
    </main>
  );
};
