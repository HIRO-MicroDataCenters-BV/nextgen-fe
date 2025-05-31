<template>
  <AppContent
    :title="t('title.create_catalog_item')"
    :description="t('subtitle.create_catalog_item_desc')"
    @submit="onSubmitDirect"
    @change-file="onChangeFile"
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
const { uploadMmioFile } = useApi();
const router = useRouter();

const formSchema = z.object({
  metadata_content: z.string().min(1),
  file: z.any(),
});

const formRef = ref();

const initialValues = {
  metadata_content: "",
  file: null,
};

const onChangeFile = (file: File) => {
  console.log("File changed: ", file);
}
const onSubmitDirect = () => {
  formRef.value.submit();
}


const onCancel = () => {
  console.log("Form cancelled");
}

const onSubmit = (formValues: Record<string, unknown>) => {
  if (formValues.file) {
    uploadMmioFile(formValues.file as File);
    router.push("/my_catalog");
  }
};


// Для AppHeader: можно вызвать formRef.value.submit() или formRef.value.cancel() из layout
</script>
