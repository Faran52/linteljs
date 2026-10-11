<script lang="ts">
  import { styles } from './CodeText.styles';

  interface Props {
    text: string;
    tone?: keyof typeof styles;
  }

  const { text, tone }: Props = $props();

  // A translation marks each command `<code>`: split here, so no message is rendered as HTML.
  const parts = $derived(text.split(/<\/?code>/u));
  const toneStyle = $derived(tone === undefined ? undefined : styles[tone]);
</script>

<span>
  {#each parts as part, index (index)}
    {#if index % 2 === 1}
      <code {...toneStyle}>{part}</code>
    {:else}
      {part}
    {/if}
  {/each}
</span>
