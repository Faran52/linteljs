<script lang="ts">
  import { CONTACT_COPY } from '#lib/services/contact-form/constants.ts';
  import { CONTACT_TEXT } from '#lib/services/contact-form/contactFormService.ts';

  import Button from '@ui/button/Button.svelte';
  import TextInput from '@ui/text-input/TextInput.svelte';

  import { useContactForm } from './use-contact-form/useContactForm';

  const form = useContactForm((key) => {
    return CONTACT_TEXT[key];
  });
</script>

<main class="page">
  <h1 class="page-title">Contact</h1>
  <p class="page-lede">{CONTACT_COPY.lede}</p>

  {#if form.sent}
    <p class="sent" role="status">{CONTACT_COPY.sent}</p>
  {:else}
    <form novalidate onsubmit={form.onSubmit}>
      <TextInput {...form.fields.email} />
      <TextInput {...form.fields.message} />
      <Button type="submit" disabled={!form.canSubmit}>Send</Button>
    </form>
  {/if}
</main>
