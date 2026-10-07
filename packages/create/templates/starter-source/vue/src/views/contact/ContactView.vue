<script setup lang="ts">
import { CONTACT_COPY } from '@services/contact-form/constants';
import { CONTACT_TEXT } from '@services/contact-form/contactFormService';

import AppButton from '@ui/app-button/AppButton.vue';
import TextInput from '@ui/text-input/TextInput.vue';

import { useContactForm } from './use-contact-form/useContactForm';

const form = useContactForm((key) => {
  return CONTACT_TEXT[key];
});
</script>

<template>
  <main class="page">
    <h1 class="page-title">
      Contact
    </h1>
    <p class="page-lede">
      {{ CONTACT_COPY.lede }}
    </p>

    <p
      v-if="form.sent"
      class="sent"
      role="status"
    >
      {{ CONTACT_COPY.sent }}
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
        Send
      </AppButton>
    </form>
  </main>
</template>
