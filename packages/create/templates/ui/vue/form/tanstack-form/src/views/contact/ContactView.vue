<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AppButton from '@ui/app-button/AppButton.vue';
import TextInput from '@ui/text-input/TextInput.vue';

import { useContactForm } from './use-contact-form/useContactForm';
import { styles } from './ContactView.styles';

const { t } = useI18n();
const form = useContactForm((key) => {
  return t(key);
});
</script>

<template>
  <main v-bind="styles.page">
    <h1 v-bind="styles.pageTitle">
      {{ t('contact') }}
    </h1>
    <p v-bind="styles.pageLede">
      {{ t('contactLede') }}
    </p>

    <p
      v-if="form.sent"
      v-bind="styles.sent"
      role="status"
    >
      {{ t('contactSent') }}
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
        {{ t('contactSend') }}
      </AppButton>
    </form>
  </main>
</template>
