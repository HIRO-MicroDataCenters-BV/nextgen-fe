<template>
  <AppContent
    :title="t('title.edit_catalog_item')"
    :description="t('subtitle.edit_catalog_item_desc')"
    @submit="onSubmitDirect"
    @change-file="onChangeFile"
  >
    <div v-if="loading" class="flex justify-center items-center h-64">
      <p>{{ t("status.loading_data") }}</p>
    </div>
    <div v-else-if="!loading && initialValues" class="px-14 py-6">
      <AppFormRaw
        ref="formRef"
        :form-schema="formSchema"
        :initial-values="initialValues"
        @submit="onSubmit"
        @cancel="onCancel"
      />
    </div>
    <div v-else class="text-center py-10">
      <p>{{ t("status.item_not_found") }}</p>
      <Button class="mt-4" @click="goBackToCatalog">{{
        t("action.back_to_catalog")
      }}</Button>
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import * as z from "zod";
import {
  convertJsonLdDatasetToJson,
} from "~/utils/jsonld";

const { t } = useI18n();
const { uploadMmioFile, saveDataset, getDataset } = useApi();
const router = useRouter();
const route = useRoute();
const { id } = route.params;

const { setPage } = useApp();

const loading = ref(true);

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

const onSubmit = async (formValues: Record<string, unknown>) => {
  if (formValues.file) {
    const file = formValues.file as File;
    const name = file.name;
    await uploadMmioFile(file);
    await saveDataset(name, formValues.metadata_content as string);
  }
  if(formValues.metadata_content != initialValues.metadata_content && formValues.metadata_content != "") {
    await saveDataset(id as string, formValues.metadata_content as string);
    router.push("/my_catalog");
  }
};

const goBackToCatalog = () => {
  router.push("/my_catalog");
};

onMounted(async () => {
  const dataset = await getDataset(id as string);
  if (dataset) {
    console.log("Dataset: ", dataset);
    setTimeout(() => {
      formRef.value.setFieldValue("metadata_content", JSON.stringify(dataset, null, 2));
    }, 0);
    const converted = convertJsonLdDatasetToJson(dataset, {
        preferredLanguage: "en",
        includeRawData: false,
        flattenArrays: true,
        excludeOriginalData: true,
    });
    setPage({
      title: converted.title as string,
      subtitle: converted.description as string,
    })
    console.log("Dataset: ", dataset);
  }
  loading.value = false;
});
</script>
