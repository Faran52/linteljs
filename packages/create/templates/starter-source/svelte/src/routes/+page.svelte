<script lang="ts">
  import { NAME } from '@config/linteljs';

  import Mark from '../components/ui/mark/Mark.svelte';
</script>

<main class="hero">
  <Mark />
  <h1 class="title">{NAME}</h1>
  <p class="lede">Svelte, SvelteKit and the standard already applied.</p>
  <p class="hint">
    Run <code>pnpm check</code> for lint, types, tests and build.
  </p>
</main>
