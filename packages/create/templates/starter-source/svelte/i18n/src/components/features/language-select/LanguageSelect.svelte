<script lang="ts">
  import {
    chooseLanguage,
    locale,
    m,
  } from '@i18n';
  import { languages } from '@i18n/config';

  import type { HTMLSelectAttributes } from 'svelte/elements';

  const attributes: HTMLSelectAttributes = $props();
</script>

<!-- Styled by the header that holds it, so every header keeps one visual language. -->
<select
  {...attributes}
  value={$locale}
  aria-label={m.language()}
  onchange={(event) => {
    chooseLanguage(event.currentTarget.value);
  }}
>
  {#each languages as option (option.id)}
    <!-- Spread: a bare `value` compiles to a branch only a re-render reaches. -->
    {@const optionAttributes = { value: option.id, lang: option.id }}
    <option {...optionAttributes}>{option.label}</option>
  {/each}
</select>
