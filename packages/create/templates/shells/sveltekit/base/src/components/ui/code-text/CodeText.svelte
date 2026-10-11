<script lang="ts">
  interface Props {
    text: string;
  }

  const { text }: Props = $props();

  // A translation marks each command `<code>`: split here, so no message is rendered as HTML.
  const parts = $derived(text.split(/<\/?code>/u));
</script>

<span>
  {#each parts as part, index (index)}
    {#if index % 2 === 1}
      <code>{part}</code>
    {:else}
      {part}
    {/if}
  {/each}
</span>
