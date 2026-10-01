<script lang="ts">
  import Button from '../../components/ui/button/Button.svelte';
  import TextInput from '../../components/ui/text-input/TextInput.svelte';
  import { m } from '../../i18n';

  import { useContactForm } from './useContactForm';

  const form = useContactForm();
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
