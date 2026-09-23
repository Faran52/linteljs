<script lang="ts">
  import Button from '../../components/ui/button/Button.svelte';
  import TextInput from '../../components/ui/text-input/TextInput.svelte';

  import { useContactForm } from './useContactForm';

  /*
   * One page, whichever data layer submits it. The binding lives in `useContactForm` and the submit in
   * `lib/apis/contact`, so this file is the same in every combination and the suite beside it covers all of them.
   */
  const form = useContactForm();
</script>

<main class="page">
  <h1 class="page-title">Contact</h1>
  <p class="page-lede">Two fields, validated on blur. Nothing is sent anywhere.</p>

  {#if form.sent}
    <p class="sent" role="status">Thanks. Nothing was sent, this is a starter.</p>
  {:else}
    <form novalidate onsubmit={form.onSubmit}>
      <TextInput {...form.fields.email} />
      <TextInput {...form.fields.message} />
      <Button type="submit" disabled={!form.canSubmit}>Send</Button>
    </form>
  {/if}
</main>
