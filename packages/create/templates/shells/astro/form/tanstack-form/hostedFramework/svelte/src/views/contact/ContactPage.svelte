<script lang="ts">
  import Button from '@ui/button/Button.svelte';
  import TextInput from '@ui/text-input/TextInput.svelte';

  import { useContactForm } from './use-contact-form/useContactForm';

  import type { ContactCopyKey } from './utils/contactCopyUtils';

  interface Props {
    phrase: (key: ContactCopyKey) => string;
  }

  const { phrase }: Props = $props();

  const form = useContactForm((key) => {
    return phrase(key);
  });
</script>

<main class="page">
  <h1 class="page-title">{phrase('contact')}</h1>
  <p class="page-lede">{phrase('contactLede')}</p>

  {#if form.sent}
    <p class="sent" role="status">{phrase('contactSent')}</p>
  {:else}
    <form novalidate onsubmit={form.onSubmit}>
      <TextInput {...form.fields.email} />
      <TextInput {...form.fields.message} />
      <Button type="submit" disabled={!form.canSubmit}>{phrase('contactSend')}</Button>
    </form>
  {/if}
</main>
