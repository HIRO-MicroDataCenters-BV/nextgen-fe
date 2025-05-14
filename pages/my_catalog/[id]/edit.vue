<template>
  <AppContent :title="t('title.edit_catalog_item')" :description="t('subtitle.edit_catalog_item_desc')">
    <!-- AppHeader is now expected to be in a parent layout and emit 'save-form' and 'discard-form' events -->
    <!-- This page component should have its onSubmit and onCancel methods triggered by those events -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <p>{{ t('status.loading_data') }}</p>
    </div>
    <form v-else-if="!loading && initialValues" @submit.prevent="onSubmit" class="space-y-6 max-w-lg px-14 py-6">
      <FormField v-slot="{ componentField }" name="dataProductName">
        <FormItem>
          <FormLabel>{{ t('label.data_product_name') }}</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="creator">
        <FormItem>
          <FormLabel>{{ t('label.creator') }}</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="license">
        <FormItem>
          <FormLabel>{{ t('label.license') }}</FormLabel>
          <Select v-bind="componentField" class="w-full">
            <FormControl>
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="t('placeholder.select_license')" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="option in licenseOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="issued">
        <FormItem class="flex flex-col">
          <FormLabel>{{ t('label.issued_date') }}</FormLabel>
          <Popover>
            <PopoverTrigger as-child>
              <FormControl>
                <Button
                  variant="outline"
                  :class="cn(
                    'w-full justify-start text-left font-normal',
                    !values.issued && 'text-muted-foreground',
                  )"
                  type="button"
                >
                  <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                  <span>{{ values.issued ? df.format(values.issued) : t('placeholder.pick_date') }}</span>
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-bind="componentField" />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField name="lastUpdated">
        <FormItem class="flex flex-col">
          <FormLabel>{{ t('label.last_updated') }}</FormLabel>
          <Popover>
            <PopoverTrigger as-child>
              <FormControl>
                <Button
                  variant="outline"
                  disabled
                  type="button"
                  :class="cn(
                    'w-full justify-start text-left font-normal',
                    !values.lastUpdated && 'text-muted-foreground',
                  )"
                >
                  <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                  <span>{{ values.lastUpdated ? df.format(values.lastUpdated) : t('placeholder.no_date') }}</span>
                </Button>
              </FormControl>
            </PopoverTrigger>
          </Popover>
          <FormMessage />
        </FormItem>
      </FormField>
    </form>
    <div v-else class="text-center py-10">
       <p>{{ t('status.item_not_found') }}</p>
       <Button @click="goBackToCatalog" class="mt-4">{{ t('action.back_to_catalog') }}</Button>
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

import AppContent from '@/components/app/Content.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
// import { Icon } from '#components';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const dayjs = useDayjs();
const df = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

const loading = ref(true);
const initialValues = ref<FormValues | null>(null);

const licenseOptions = ref([
  { value: 'cc_by', label: 'Creative Commons BY' },
  { value: 'cc_by_sa', label: 'Creative Commons BY-SA' },
  { value: 'cc_by_nc', label: 'Creative Commons BY-NC' },
  { value: 'mit', label: 'MIT License' },
  { value: 'gpl_3', label: 'GPLv3' },
  { value: 'proprietary', label: 'Proprietary' },
]);

const formSchemaDefinition = z.object({
  dataProductName: z.string().min(3, { message: t('validation.required_min_length') }),
  creator: z.string().min(2, { message: t('validation.required_min_length') }),
  license: z.string({ required_error: t('validation.required') }),
  issued: z.date({ required_error: t('validation.required_date') }),
  lastUpdated: z.date().optional(),
});

type FormValues = z.infer<typeof formSchemaDefinition>;
const formSchema = toTypedSchema(formSchemaDefinition);

const { handleSubmit, setValues, values, resetForm, submitForm } = useForm<FormValues>({
  validationSchema: formSchema,
});

const mockFetchCatalogItem = async (id: string): Promise<FormValues | null> => {
  console.log('Fetching item with id:', id);
  await new Promise(resolve => setTimeout(resolve, 500));
  const MOCK_DATA_SOURCE = [
    { id: '1', dataProductName: 'Genomic Data Set Alpha', creator: 'Dr. Scientist', license: 'cc_by', issued: new Date(2023, 0, 15), lastUpdated: new Date(2023, 5, 10) },
    { id: '2', dataProductName: 'Clinical Trial Results Beta', creator: 'Pharma Corp', license: 'proprietary', issued: new Date(2022, 6, 20), lastUpdated: new Date(2023, 8, 1) },
  ];
  const item = MOCK_DATA_SOURCE.find(item => item.id === id);
  if (item) {
    return {
        ...item,
        issued: new Date(item.issued),
        lastUpdated: new Date(item.lastUpdated),
    };
  }
  return null;
};

onMounted(async () => {
  const itemId = route.params.id as string;
  if (itemId) {
    const data = await mockFetchCatalogItem(itemId);
    if (data) {
      initialValues.value = data;
      resetForm({ values: data });
    } else {
      console.error('Item not found');
    }
  }
  loading.value = false;
});

// This function should be triggered by 'save-form' event from AppHeader
const onSubmit = handleSubmit(async (formValues) => {
  console.log('Form submitted for update!', formValues);
  const itemId = route.params.id as string;
  alert(`Data Product ${itemId} Updated (simulated): ` + JSON.stringify(formValues, null, 2));
  router.push('/my_catalog');
});

// This function should be triggered by 'discard-form' event from AppHeader
const onCancel = () => {
  router.push('/my_catalog');
};

const goBackToCatalog = () => {
    router.push('/my_catalog');
}

// Expose methods if a parent/layout needs to call them programmatically
// defineExpose({ onSubmit, onCancel, submitForm });

// Placeholder for i18n keys from AppHeader that this page might influence:
/*
t('header_title.edit_catalog_item_details')
t('header_subtitle.change_metadata_details')
t('action.save_changes')
t('action.discard')
*/
</script> 