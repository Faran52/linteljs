<script lang="ts">
  import DataProvider from '#lib/providers/data/DataProvider.svelte';

  import ContactFormProbe from './ContactFormProbe.svelte';

  import type { ContactForm } from '@views/contact/use-contact-form/useContactForm';
  import type { Translate } from '#lib/services/contact-form/contactFormService.ts';

  interface Props {
    translate: Translate;
    capture: (form: ContactForm) => void;
  }

  const { translate, capture }: Props = $props();
</script>

<DataProvider>
  <ContactFormProbe {translate} {capture} />
</DataProvider>
