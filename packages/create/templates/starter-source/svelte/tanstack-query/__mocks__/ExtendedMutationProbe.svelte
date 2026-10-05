<script lang="ts">
  import { untrack } from 'svelte';
  import { createExtendedMutation } from '#lib/hooks/create-extended-mutation/createExtendedMutation.ts';

  interface Props {
    path: string;
    invalidates?: readonly string[] | undefined;
  }

  interface Answered {
    status: string;
  }

  interface Sent {
    message: string;
  }

  const { path, invalidates = [] }: Props = $props();

  // The probe is handed one path for its lifetime, so reading it once is the intent rather than a missed dependency.
  const mutation = untrack(() => {
    return createExtendedMutation<Answered, Sent>(path, { invalidates });
  });

  const send = (): void => {
    mutation.mutate({ message: 'hello there' });
  };
</script>

<button type="button" onclick={send}>send</button>
<output data-testid="status">{mutation.status}</output>
