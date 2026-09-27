import { Button, TextInput } from '../../components/ui';

import { useContactForm } from './useContactForm';

import type { FC } from 'react';

export const ContactPage: FC = () => {
  const {
    fields,
    sent,
    submitting,
    canSubmit,
    onSubmit,
  } = useContactForm();

  return (
    <main className="page">
      <h1 className="page-title">Contact</h1>
      <p className="page-lede">Two fields, validated on blur. Nothing is sent anywhere.</p>

      {sent
        ? (
            <p className="sent" role="status">Thanks. Nothing was sent, this is a starter.</p>
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
