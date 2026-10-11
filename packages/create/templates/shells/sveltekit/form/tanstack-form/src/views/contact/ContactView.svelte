<script lang="ts">
  import { m } from '@i18n/i18n';

  import Button from '@ui/button/Button.svelte';
  import TextInput from '@ui/text-input/TextInput.svelte';

  import { useContactForm } from './use-contact-form/useContactForm';
  import { styles } from './ContactView.styles';

  const form = useContactForm((key) => {
    return m[key]();
  });
</script>

<main {...styles.page}>
  <h1 {...styles.pageTitle}>{m.contact()}</h1>
  <p {...styles.pageLede}>{m.contactLede()}</p>

  {#if form.sent}
    <p {...styles.sent} role="status">{m.contactSent()}</p>
  {:else}
    <form novalidate onsubmit={form.onSubmit}>
      <TextInput {...form.fields.email} />
      <TextInput {...form.fields.message} />
      <Button type="submit" disabled={!form.canSubmit}>{m.contactSend()}</Button>
    </form>
  {/if}
</main>
