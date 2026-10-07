<script lang="ts">
  import { m } from '@i18n';

  import Button from '@ui/button/Button.svelte';
  import TextInput from '@ui/text-input/TextInput.svelte';

  import { useContactForm } from './use-contact-form/useContactForm';

  const form = useContactForm((key) => {
    return m[key]();
  });
</script>

<main class="page">
  <h1 class="page-title">{m.contact()}</h1>
  <p class="page-lede">{m.contactLede()}</p>

  {#if form.sent}
    <p class="sent" role="status">{m.contactSent()}</p>
  {:else}
    <form novalidate onsubmit={form.onSubmit}>
      <TextInput {...form.fields.email} />
      <TextInput {...form.fields.message} />
      <Button type="submit" disabled={!form.canSubmit}>{m.contactSend()}</Button>
    </form>
  {/if}
</main>
