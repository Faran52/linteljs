<script lang="ts">
  import { useSubmitContact } from '#lib/apis/contact/contactApi.ts';

  import type { ContactValues } from '#lib/services/contact-form/contactFormService.ts';

  const submit = useSubmitContact();

  let outcome = $state('waiting');

  const send = async (values: ContactValues): Promise<void> => {
    try {
      const result = await submit(values);

      outcome = `sent ${String(result.status)}`;
    }
    catch {
      outcome = 'refused';
    }
  };

  const sendAccepted = (): void => {
    void send({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });
  };

  const sendRefused = (): void => {
    void send({
      email: 'not-an-address',
      message: 'short',
    });
  };
</script>

<button type="button" onclick={sendAccepted}>accepted</button>
<button type="button" onclick={sendRefused}>refused</button>
<output data-testid="outcome">{outcome}</output>
