<script setup lang="ts">
import AppButton from '@ui/app-button/AppButton.vue';
import TextInput from '@ui/text-input/TextInput.vue';

import { useContactForm } from './use-contact-form/useContactForm';

import type { ContactCopyKey } from './utils/contactCopyUtils';

interface Props {
  translate: (key: ContactCopyKey) => string;
}

const props = defineProps<Props>();

const form = useContactForm((key) => {
  return props.translate(key);
});
</script>

<template>
  <main class="page">
    <h1 class="page-title">
      {{ translate('contact') }}
    </h1>
    <p class="page-lede">
      {{ translate('contactLede') }}
    </p>

    <p
      v-if="form.sent"
      class="sent"
      role="status"
    >
      {{ translate('contactSent') }}
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
        {{ translate('contactSend') }}
      </AppButton>
    </form>
  </main>
</template>
