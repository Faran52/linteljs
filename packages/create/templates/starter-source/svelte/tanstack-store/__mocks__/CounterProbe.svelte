<script lang="ts">
  import { useCounter } from '#lib/store/counter/counterStore.ts';

  const one = useCounter();
  const two = useCounter();
</script>

<button type="button" onclick={one.add}>one {one.count}</button>
<output data-testid="two">two {two.count}</output>
