<script setup lang="ts">
import AppButton from '@ui/app-button/AppButton.vue';
import TextInput from '@ui/text-input/TextInput.vue';

import { useContactForm } from './use-contact-form/useContactForm';
import { styles } from './ContactPage.styles';

import type { ContactCopyKey } from './utils/contactCopyUtils';

interface Props {
  phrase: (key: ContactCopyKey) => string;
}

const props = defineProps<Props>();

const form = useContactForm((key) => {
  return props.phrase(key);
});
</script>

<template>
  <main v-bind="styles.page">
    <h1 v-bind="styles.pageTitle">
      {{ phrase('contact') }}
    </h1>
    <p v-bind="styles.pageLede">
      {{ phrase('contactLede') }}
    </p>

    <p
      v-if="form.sent"
      v-bind="styles.sent"
      role="status"
    >
      {{ phrase('contactSent') }}
    </p>
    <form
      v-else
      novalidate
      @submit="form.onSubmit"
    >
      <TextInput
        v-bind="form.fields.email"
        @change="(value: string) => form.set('email', value)"
        @blur="form.blur('email')"
      />
      <TextInput
        v-bind="form.fields.message"
        @change="(value: string) => form.set('message', value)"
        @blur="form.blur('message')"
      />
      <AppButton
        type="submit"
        :disabled="!form.canSubmit"
      >
        {{ phrase('contactSend') }}
      </AppButton>
    </form>
  </main>
</template>
