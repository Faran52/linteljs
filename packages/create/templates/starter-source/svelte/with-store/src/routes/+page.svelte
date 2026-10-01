<script lang="ts">
  import { CHECK, NAME } from '@config/linteljs';

  import Button from '@ui/button/Button.svelte';
  import Mark from '@ui/mark/Mark.svelte';

  import { useCounter } from '$lib/store/counter/counterStore';

  const counter = useCounter();
</script>

<main class="hero">
  <Mark />
  <h1 class="title">{NAME}</h1>
  <p class="lede">Svelte, SvelteKit and the standard already applied.</p>

  <div class="counter">
    <span class="count" aria-live="polite">{counter.count}</span>
    <Button onclick={counter.add}>Add one</Button>
  </div>
  <p class="caption">Held in a store, across every page.</p>

  <p class="hint">
    Run <code>{CHECK}</code> for the full gate.
  </p>
</main>
