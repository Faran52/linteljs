import { CONTACT_TEXT, type Translate } from '@services/contact-form/contactFormService';

import { Button, TextInput } from '@ui';

import { createContactForm } from './create-contact-form/createContactForm';

import type { JSX } from 'solid-js';

const inEnglish: Translate = (key) => {
  return CONTACT_TEXT[key];
};

export const ContactPage = (): JSX.Element => {
  const form = createContactForm(inEnglish);

  return (
    <main class="page">
      <h1 class="page-title">Contact</h1>
      <p class="page-lede">Two fields, validated on blur. It posts to /api/contact, mocked in dev.</p>

      {form.sent()
        ? <p class="sent" role="status">Thanks. Your message was sent.</p>
        : (
            <form novalidate onSubmit={form.onSubmit}>
              <TextInput {...form.fields.email} />
              <TextInput {...form.fields.message} />
              <Button type="submit" disabled={!form.canSubmit()}>Send</Button>
            </form>
          )}
    </main>
  );
};
