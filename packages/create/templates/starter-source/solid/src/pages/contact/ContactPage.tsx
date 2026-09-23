import { Button, TextInput } from '../../components/ui';

import { useContactForm } from './useContactForm';

import type { JSX } from 'solid-js';

/*
 * One page, whichever data layer submits it. The binding lives in `useContactForm` and the submit in
 * `lib/apis/contact`, so this file is the same in every combination and the suite beside it covers all of them.
 */
export const ContactPage = (): JSX.Element => {
  const form = useContactForm();

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
