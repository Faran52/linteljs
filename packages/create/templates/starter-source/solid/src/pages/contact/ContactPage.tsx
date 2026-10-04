import { Button, TextInput } from '@ui';

import { createContactForm } from './createContactForm';

import type { JSX } from 'solid-js';

export const ContactPage = (): JSX.Element => {
  const form = createContactForm();

  return (
    <main class="page">
      <h1 class="page-title">Contact</h1>
      <p class="page-lede">Two fields, validated on blur. Nothing is sent anywhere.</p>

      {form.sent()
        ? <p class="sent" role="status">Thanks. Nothing was sent, this is a starter.</p>
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
