<script setup lang="ts">
import AppButton from '../components/ui/app-button/AppButton.vue';
import TextInput from '../components/ui/text-input/TextInput.vue';

import { useContactForm } from './useContactForm';

const form = useContactForm();
</script>

<template>
  <main class="page">
    <h1 class="page-title">
      Contact
    </h1>
    <p class="page-lede">
      Two fields, validated on blur. Nothing is sent anywhere.
    </p>

    <p
      v-if="form.sent"
      class="sent"
      role="status"
    >
      Thanks. Nothing was sent, this is a starter.
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
