<template>
  <AppContent :title="t('title.create_catalog_item')" :description="t('subtitle.create_catalog_item_desc')">
    <div class="px-14 py-6">
      <AppForm
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import * as z from 'zod';
import AppContent from '@/components/app/Content.vue';
import AppForm, { type FormFieldDefinition } from '@/components/app/Form.vue';

const { t } = useI18n();
const router = useRouter();

const licenseOptions = [
  { value: 'cc_by', label: 'Creative Commons BY' },
  { value: 'cc_by_sa', label: 'Creative Commons BY-SA' },
  { value: 'cc_by_nc', label: 'Creative Commons BY-NC' },
  { value: 'mit', label: 'MIT License' },
  { value: 'gpl_3', label: 'GPLv3' },
  { value: 'proprietary', label: 'Proprietary' },
];

const formSchema = [
  {
    label: 'main',
    fields: [
      {
        name: 'dataProductName',
        label: t('label.data_product_name'),
        type: 'text',
        placeholder: t('placeholder.data_product_name'),
        validation: z.string().min(3, { message: t('validation.required_min_length') }),
      },
      {
        name: 'creator',
        label: t('label.creator'),
        type: 'text',
        placeholder: t('placeholder.creator'),
        validation: z.string().min(2, { message: t('validation.required_min_length') }),
      },
      {
        name: 'license',
        label: t('label.license'),
        type: 'select',
        placeholder: t('placeholder.select_license'),
        options: licenseOptions,
        validation: z.string({ required_error: t('validation.required') }),
      },
      {
        name: 'issued',
        label: t('label.issued_date'),
        type: 'date',
        placeholder: t('placeholder.pick_date'),
        validation: z.date({ required_error: t('validation.required_date') }),
      },
      {
        name: 'tags',
        label: t('label.tags'),
        type: 'tags',
        placeholder: t('placeholder.tags_input'),
        options: [
          { value: 'foo', label: 'foo' },
          { value: 'bar', label: 'bar' },
          { value: 'baz', label: 'baz' }
        ],
        validation: z.array(z.string()).optional(),
      },
    ]
  }
];

const formRef = ref();

const initialValues = {
  tags: ['foo', 'bar']
};

const onSubmit = (formValues: Record<string, unknown>) => {
  alert('Data Product Created (simulated): ' + JSON.stringify(formValues, null, 2));
  router.push('/my_catalog');
};

const onCancel = () => {
  router.push('/my_catalog');
};

// Для AppHeader: можно вызвать formRef.value.submit() или formRef.value.cancel() из layout
</script> 