<script lang="ts">
  import { untrack } from 'svelte';

  import { type ContactForm, useContactForm } from '../src/routes/contact/use-contact-form/useContactForm';

  import type { Translate } from '#lib/services/contact-form/contactFormService.ts';

  interface Props {
    translate: Translate;
    capture: (form: ContactForm) => void;
  }

  // A `<script>` runs before its own template, so the hook reading context sits one component down.
  const { translate, capture }: Props = $props();

  untrack(() => {
    const form = useContactForm(translate);

    capture(form);
  });
</script>
