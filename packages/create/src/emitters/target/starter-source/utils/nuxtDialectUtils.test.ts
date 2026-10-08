import {
  describe,
  expect,
  it,
} from 'vitest';

import { inNuxtDialect } from './nuxtDialectUtils';

const VUE_SOURCE = `<script setup lang="ts">
import { computed } from 'vue';

import { useI18n } from 'vue-i18n';

import AppButton from '@ui/app-button/AppButton.vue';
import TextInput from '@ui/text-input/TextInput.vue';

import AppHeader from '@features/app-header/AppHeader.vue';

import HomeView from '@views/home/HomeView.vue';

import type { TextInputProps } from './types';

const { t } = useI18n();
</script>
`;

const NUXT_SOURCE = `<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import HomeView from '@views/home/HomeView.vue';

import type { TextInputProps } from './types';

const { t } = useI18n();
</script>
`;

describe('inNuxtDialect', () => {
  it('drops what Nuxt auto-imports and keeps the rest', () => {
    const actual = inNuxtDialect('src/views/home/HomeView.vue')(VUE_SOURCE);
    expect(actual).toBe(NUXT_SOURCE);
  });

  it.each([
    [
      'a leading import group of a TypeScript file',
      "import { ref } from 'vue';\n\nimport { useForm } from '@tanstack/vue-form';\n",
      "import { useForm } from '@tanstack/vue-form';\n",
    ],
    [
      'two remaining specifiers onto one line',
      "import {\n  computed,\n  onMounted,\n  watch,\n} from 'vue';\n",
      "import { onMounted, watch } from 'vue';\n",
    ],
    [
      'three remaining specifiers one per line',
      "import {\n  type Ref,\n  ref,\n  onMounted,\n  watch,\n} from 'vue';\n",
      "import {\n  type Ref,\n  onMounted,\n  watch,\n} from 'vue';\n",
    ],
    [
      'useRoute from vue-router, leaving other modules alone',
      "import { useRoute } from 'vue-router';\nimport { ref } from 'pinia';\n",
      "import { ref } from 'pinia';\n",
    ],
  ])('rewrites %s', (_name, source, expected) => {
    const actual = inNuxtDialect('src/views/contact/use-contact-form/useContactForm.ts')(source);
    expect(actual).toBe(expected);
  });

  it('drops a relative component import only inside src/components', () => {
    const source = "import StatusPage from '../status-page/StatusPage.vue';\n";

    const inside = inNuxtDialect('src/components/features/error-boundary/ErrorBoundary.vue')(source);
    const outside = inNuxtDialect('src/views/home/HomeView.vue')(source);
    expect(inside).toBe('');
    expect(outside).toBe(source);
  });
});
