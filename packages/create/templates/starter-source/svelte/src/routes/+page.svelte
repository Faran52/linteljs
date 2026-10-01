<script lang="ts">
  import { CHECK, NAME } from '@config/linteljs';

  import Mark from '@ui/mark/Mark.svelte';
</script>

<main class="hero">
  <Mark />
  <h1 class="title">{NAME}</h1>
  <p class="lede">Svelte, SvelteKit and the standard already applied.</p>
  <p class="hint">
    Run <code>{CHECK}</code> for the full gate.
  </p>
</main>
