<template>
  <AppContent :title="t('title.create_catalog_item')" :description="t('subtitle.create_catalog_item_desc')">
    <!-- AppHeader is now expected to be in a parent layout and emit 'save-form' and 'discard-form' events -->
    <!-- This page component should have its onSubmit and onCancel methods triggered by those events -->
    <form @submit.prevent="onSubmit" class="space-y-6 max-w-lg px-14 py-6">
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

      <!-- Buttons removed from here -->
      <!-- 
      <div class="flex justify-end space-x-2">
        <Button type="button" variant="outline" @click="onCancel">
          {{ t('action.cancel') }}
        </Button>
        <Button type="submit">
          {{ t('action.create') }}
        </Button>
      </div>
      -->
    </form>
  </AppContent>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
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
const router = useRouter();
const dayjs = useDayjs(); 
const df = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

const licenseOptions = ref([
  { value: 'cc_by', label: 'Creative Commons BY' },
  { value: 'cc_by_sa', label: 'Creative Commons BY-SA' },
  { value: 'cc_by_nc', label: 'Creative Commons BY-NC' },
  { value: 'mit', label: 'MIT License' },
  { value: 'gpl_3', label: 'GPLv3' },
  { value: 'proprietary', label: 'Proprietary' },
]);

const formSchemaDefinition = z.object({
  dataProductName: z.string().min(3, { message: t('validation.required_min_3') }),
  creator: z.string().min(2, { message: t('validation.required_min_2') }),
  license: z.string({ required_error: t('validation.required') }),
  issued: z.date({ required_error: t('validation.required_date') }),
});

const formSchema = toTypedSchema(formSchemaDefinition);

const { handleSubmit, values, setValues, submitForm } = useForm<z.infer<typeof formSchemaDefinition>>({
  validationSchema: formSchema,
  initialValues: {},
});

// This function should be triggered by 'save-form' event from AppHeader
const onSubmit = handleSubmit(async (formValues) => {
  console.log('Form submitted!', formValues);
  alert('Data Product Created (simulated): ' + JSON.stringify(formValues, null, 2));
  router.push('/my_catalog');
});

// This function should be triggered by 'discard-form' event from AppHeader
const onCancel = () => {
  router.push('/my_catalog');
};

// Expose methods if a parent/layout needs to call them programmatically
// defineExpose({ onSubmit, onCancel, submitForm }); // submitForm can be used to trigger validation and submission

// Placeholder for i18n keys from AppHeader that this page might influence:
/*
t('header_title.create_catalog_item_details')
t('header_subtitle.new_metadata_details')
t('action.save_changes')
t('action.discard')
*/
</script> 