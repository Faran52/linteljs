<script lang="ts">
  import * as stylex from '@stylexjs/stylex';

  const sheet = stylex.create({
    card: { background: 'var(--card)' },
  });

  const attrs = stylex.attrs(sheet.card);
</script>

<div {...attrs}>x</div>
