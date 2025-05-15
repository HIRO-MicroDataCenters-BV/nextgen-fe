<script setup lang="ts">
import { computed, watch, toRefs } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField as VeeFormField,
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
// import { Icon } from '#components'; // Assuming Icon is globally available or auto-imported

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldDefinition {
  name: string;
  label: string; // Can be an i18n key
  type: 'text' | 'select' | 'date' | 'textarea';
  placeholder?: string; // Can be an i18n key
  options?: FormFieldOption[];
  validation?: z.ZodTypeAny;
  disabled?: boolean;
  props?: Record<string, unknown>; // For additional props like 'rows' for textarea
}

export interface AppFormProps {
  formSchema: FormFieldDefinition[];
  initialValues?: Record<string, unknown>;
  // onSubmitHandler: (values: Record<string, any>) => Promise<void> | void;
  // onCancelHandler?: () => void;
}

const props = defineProps<AppFormProps>();
const emit = defineEmits(['submit', 'cancel', 'update:values']);

const { formSchema, initialValues } = toRefs(props);

const { t } = useI18n();
const dayjs = useDayjs();
const df = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

// Dynamically create Zod schema
const dynamicSchema = computed(() => {
  const shape: Record<string, z.ZodTypeAny> = {};
  formSchema.value.forEach(field => {
    if (field.validation) {
      shape[field.name] = field.validation;
    } else {
      // Provide a default validation if none is specified
      switch (field.type) {
        case 'text':
        case 'textarea':
          shape[field.name] = z.string().optional();
          break;
        case 'select':
          shape[field.name] = z.string().optional();
          break;
        case 'date':
          shape[field.name] = z.date().optional().nullable(); // Allow null for dates
          break;
        default:
          shape[field.name] = z.unknown().optional();
      }
    }
  });
  return z.object(shape);
});

const typedSchema = computed(() => toTypedSchema(dynamicSchema.value));

const { handleSubmit, values, setValues, meta, resetForm } = useForm({
  validationSchema: typedSchema,
  initialValues: initialValues?.value || {},
});

watch(initialValues, (newValues) => {
  if (newValues) {
    resetForm({ values: newValues });
  }
}, { deep: true, immediate: true });

watch(values, (newValues) => {
  emit('update:values', newValues);
}, { deep: true });


const onSubmit = handleSubmit((formData) => {
  emit('submit', formData);
});

const onCancel = () => {
  // resetForm({ values: initialValues?.value || {} }); // Reset to initial or empty
  emit('cancel');
};

// Expose methods to be called by parent (e.g., from AppHeader events)
defineExpose({
  submit: onSubmit,
  cancel: onCancel,
  resetForm,
  setValues,
  values, // Expose current form values
  meta // Expose meta for validity checks etc.
});

const getFormattedDate = (date: unknown) => {
  if (!date) return null;
  if (date instanceof Date) return df.format(date);
  if (typeof date === 'string') {
    const parsed = dayjs(date);
    return parsed.isValid() ? df.format(parsed.toDate()) : null;
  }
  return null;
};
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <template v-for="field in formSchema" :key="field.name">
      <VeeFormField v-slot="{ componentField, value: fieldValue }" :name="field.name">
        <FormItem>
          <FormLabel :for="field.name">{{ field.label }}</FormLabel>

          <!-- Text Input -->
          <template v-if="field.type === 'text'">
            <FormControl>
              <Input
                :id="field.name"
                type="text"
                :placeholder="field.placeholder"
                v-bind="componentField"
                :disabled="field.disabled"
              />
            </FormControl>
          </template>

          <!-- Textarea -->
          <template v-else-if="field.type === 'textarea'">
            <FormControl>
              <Textarea
                :id="field.name"
                :placeholder="field.placeholder"
                v-bind="componentField"
                :disabled="field.disabled"
                :rows="field.props?.rows || 3"
              />
            </FormControl>
          </template>

          <!-- Select Input -->
          <template v-else-if="field.type === 'select' && field.options">
            <Select v-bind="componentField" :disabled="field.disabled" class="w-full">
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="field.placeholder || t('placeholder.select_option')" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="option in field.options" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </template>

          <!-- Date Picker Input -->
          <template v-else-if="field.type === 'date'">
            <Popover>
              <PopoverTrigger as-child>
                <FormControl>
                  <Button
                    :id="field.name"
                    variant="outline"
                    :class="cn(
                      'w-full justify-start text-left font-normal',
                      !fieldValue && 'text-muted-foreground',
                      field.disabled && 'cursor-not-allowed opacity-50'
                    )"
                    type="button"
                    :disabled="field.disabled"
                  >
                    <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                    <span>{{ fieldValue ? getFormattedDate(fieldValue) : (field.placeholder || t('placeholder.pick_date')) }}</span>
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent v-if="!field.disabled" class="w-auto p-0">
                <Calendar v-bind="componentField" />
              </PopoverContent>
            </Popover>
          </template>
          <FormMessage />
        </FormItem>
      </VeeFormField>
    </template>
    <!-- Buttons are handled by AppHeader, this component exposes submit/cancel methods -->
  </form>
</template> 