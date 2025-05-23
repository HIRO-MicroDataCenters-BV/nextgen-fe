<template>
  <AppContent
    :title="t('title.create_catalog_item')"
    :description="t('subtitle.create_catalog_item_desc')"
  >
    <div class="px-14 py-6">
      <AppFormRaw
        ref="formRef"
        :form-schema="formSchema"
        :initial-values="initialValues"
        @submit="onSubmit"
        @cancel="onCancel"
      />
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import * as z from "zod";

const { t } = useI18n();
const router = useRouter();

const formSchema = z.object({
  metadata_content: z.string().min(1),
});

const formRef = ref();

const initialValues = {
  metadata_content: "",
};

const onSubmit = (formValues: Record<string, unknown>) => {
  alert(
    "Data Product Created (simulated): " + JSON.stringify(formValues, null, 2)
  );
  router.push("/my_catalog");
};

const onCancel = () => {
  router.push("/my_catalog");
};

// Для AppHeader: можно вызвать formRef.value.submit() или formRef.value.cancel() из layout
</script>
