import { Button, TextInput } from '@ui';

import { useContactForm } from './use-contact-form/useContactForm';
import { styles } from './ContactView.styles';

import type { FC } from 'react';
import type { ContactCopyKey } from './utils/contactCopyUtils';

interface ContactPageProps {
  readonly translate: (key: ContactCopyKey) => string;
}

export const ContactPage: FC<ContactPageProps> = ({ translate }) => {
  const {
    fields,
    sent,
    submitting,
    canSubmit,
    onSubmit,
  } = useContactForm(translate);

  return (
    <main {...styles.page}>
      <h1 {...styles.pageTitle}>{translate('contact')}</h1>
      <p {...styles.pageLede}>{translate('contactLede')}</p>

      {sent
        ? (
            <p {...styles.sent} role="status">{translate('contactSent')}</p>
          )
        : (
            <form noValidate onSubmit={onSubmit}>
              <TextInput {...fields.email} />
              <TextInput {...fields.message} />
              <Button type="submit" disabled={!canSubmit || submitting}>{translate('contactSend')}</Button>
            </form>
          )}
    </main>
  );
};
