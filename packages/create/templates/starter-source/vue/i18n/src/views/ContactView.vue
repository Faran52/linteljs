<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AppButton from '@ui/app-button/AppButton.vue';
import TextInput from '@ui/text-input/TextInput.vue';

import { useContactForm } from './useContactForm';

const form = useContactForm();
const { t } = useI18n();
</script>

<template>
  <main class="page">
    <h1 class="page-title">
      {{ t('contact') }}
    </h1>
    <p class="page-lede">
      {{ t('contactLede') }}
    </p>

    <p
      v-if="form.sent"
      class="sent"
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
