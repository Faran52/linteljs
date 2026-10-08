<script setup lang="ts">
import { getCurrentInstance } from 'vue';

import { dataProvider } from '@lib/providers/data/dataProvider';

import ContactPage from './ContactPage.vue';

// An island is its own Vue app, so it installs the provider its page reads.
getCurrentInstance()?.appContext.app.use(dataProvider);
</script>

<template>
  <ContactPage />
</template>
