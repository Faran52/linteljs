import { Button, TextInput } from '@ui';

import { createContactForm } from './create-contact-form/createContactForm';

import type { JSX } from 'solid-js';
import type { ContactCopyKey } from './utils/contactCopyUtils';

interface ContactPageProps {
  readonly translate: (key: ContactCopyKey) => string;
}

// Solid's own page reads its i18n library, which Astro does not install, so this one reads the words handed in.
export const ContactPage = (props: ContactPageProps): JSX.Element => {
  const form = createContactForm((key) => {
    return props.translate(key);
  });

  return (
    <main class="page">
      <h1 class="page-title">{props.translate('contact')}</h1>
      <p class="page-lede">{props.translate('contactLede')}</p>

      {form.sent()
        ? <p class="sent" role="status">{props.translate('contactSent')}</p>
        : (
            <form novalidate onSubmit={form.onSubmit}>
              <TextInput {...form.fields.email} />
              <TextInput {...form.fields.message} />
              <Button type="submit" disabled={!form.canSubmit()}>{props.translate('contactSend')}</Button>
            </form>
          )}
    </main>
  );
};
