<script lang="ts">
  import { styles } from './styles';

  import type { TextInputProps } from './types';

  const {
    id,
    label,
    value,
    onChange,
    onBlur,
    error,
    multiline = false,
    type = 'text',
  }: TextInputProps = $props();

  const describedBy = $derived(error === undefined ? undefined : `${id}-error`);
</script>

<!--
  The label is visible and bound with `for`, and the error is wired with `aria-describedby`. A dense tool pane can
  get away with `aria-label` alone; a form cannot.
-->
<div {...styles.field}>
  <label {...styles.label} for={id}>{label}</label>
  {#if multiline}
    <textarea
      {id}
      {...styles.textarea(error !== undefined)}
      name={id}
      {value}
      aria-invalid={error !== undefined}
      aria-describedby={describedBy}
      onblur={onBlur}
      oninput={(event) => {
        onChange(event.currentTarget.value);
      }}
    ></textarea>
  {:else}
    <input
      {id}
      {...styles.input(error !== undefined)}
      name={id}
      {type}
      {value}
      aria-invalid={error !== undefined}
      aria-describedby={describedBy}
      onblur={onBlur}
      oninput={(event) => {
        onChange(event.currentTarget.value);
      }}
    />
  {/if}
  {#if error !== undefined}
    <p {...styles.error} id={`${id}-error`}>{error}</p>
  {/if}
</div>
