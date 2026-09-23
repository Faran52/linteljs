<script lang="ts">
  import { NAME } from '@config/linteljs';

  import Button from '../components/ui/button/Button.svelte';
  import Mark from '../components/ui/mark/Mark.svelte';

  import { useCounter } from '$lib/store/counter';

  const counter = useCounter();
</script>

<main class="hero">
  <Mark />
  <h1 class="title">{NAME}</h1>
  <p class="lede">Svelte, SvelteKit and the standard already applied.</p>

  <!-- State that outlives the page: switch tabs and come back, and the count is still here. -->
  <div class="counter">
    <span class="count" aria-live="polite">{counter.count}</span>
    <Button onclick={counter.add}>Add one</Button>
  </div>
  <p class="caption">Held in a store, across every page.</p>

  <p class="hint">
    Run <code>pnpm check</code> for lint, types, tests and build.
  </p>
</main>
