<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TagsInput,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
} from "@/components/ui/tags-input";
// import { Icon } from '#components'; // Assuming Icon is globally available or auto-imported

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldDefinition {
  name: string;
  label: string;
  type: "text" | "select" | "date" | "textarea" | "checkbox" | "tags" | "file";
  placeholder?: string;
  options?: FormFieldOption[];
  validation?: z.ZodTypeAny;
  disabled?: boolean;
  props?: Record<string, unknown>;
}

export interface FormGroupDefinition {
  label: string;
  fields: FormFieldDefinition[];
}

export interface AppFormProps {
  id?: string;
  formSchema: FormGroupDefinition[];
  initialValues?: Record<string, unknown>;
}

const props = defineProps<AppFormProps>();
const emit = defineEmits(["submit", "cancel", "update:values"]);

const { formSchema, initialValues } = toRefs(props);

const { t } = useI18n();
const dayjs = useDayjs();
const df = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

// Build dynamic Zod schema for all fields in all groups
const dynamicSchema = computed(() => {
  const shape: Record<string, z.ZodTypeAny> = {};
  formSchema.value.forEach((group) => {
    group.fields.forEach((field) => {
      if (field.validation) {
        shape[field.name] = field.validation;
      } else {
        switch (field.type) {
          case "text":
          case "textarea":
            shape[field.name] = z.string().optional();
            break;
          case "select":
            shape[field.name] = z.string().optional();
            break;
          case "date":
            shape[field.name] = z.date().optional().nullable();
            break;
          case "checkbox":
            shape[field.name] = z.boolean().optional();
            break;
          case "tags":
            shape[field.name] = z.array(z.string()).optional();
            break;
          case "file":
            shape[field.name] = z.instanceof(FileList).optional();
            break;
          default:
            shape[field.name] = z.unknown().optional();
        }
      }
    });
  });
  return z.object(shape);
});

const typedSchema = computed(() => toTypedSchema(dynamicSchema.value));

const { handleSubmit, values, setValues, meta, resetForm, setFieldValue } =
  useForm({
    validationSchema: typedSchema,
    initialValues: initialValues?.value || {},
  });

watch(
  initialValues,
  (newValues) => {
    if (newValues) {
      resetForm({ values: newValues });
    }
  },
  { deep: true, immediate: true }
);

watch(
  values,
  (newValues) => {
    emit("update:values", newValues);
  },
  { deep: true }
);

const onSubmit = handleSubmit((formData) => {
  emit("submit", formData);
});

const onCancel = () => {
  emit("cancel");
};

defineExpose({
  submit: onSubmit,
  cancel: onCancel,
  resetForm,
  setValues,
  values,
  meta,
});

const getFormattedDate = (date: unknown) => {
  if (!date) return null;
  if (date instanceof Date) return df.format(date);
  if (typeof date === "string") {
    const parsed = dayjs(date);
    return parsed.isValid() ? df.format(parsed.toDate()) : null;
  }
  return null;
};

const isLoading = ref(false);

onMounted(async () => {
  if (props.id) {
    isLoading.value = true;
    try {
      // TODO: Replace with your API call
      const response = await fetch("/api/form/" + props.id);
      const data = await response.json();
      Object.entries(data).forEach(([key, value]) => {
        setFieldValue(key, value);
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      isLoading.value = false;
    }
  }
});
</script>

<template>
  <form class="space-y-10" @submit.prevent="onSubmit">
    <template v-for="group in formSchema" :key="group.label">
      <div class="w-full">
        <div class="grid gap-4 grid-cols-2 w-full mb-4">
          <div class="mb-2">
            <h3 class="text-lg font-semibold mb-2">
              {{ t(`fieldset.${group.label}`) }}
            </h3>
          </div>
          <div class="flex flex-col gap-4">
            <template v-for="field in group.fields" :key="field.name">
              <FormField
                v-slot="{ componentField, value: fieldValue }"
                :name="field.name"
              >
                <FormItem>
                  <FormLabel
                    v-if="field.type !== 'checkbox'"
                    :for="field.name"
                    >{{ field.label }}</FormLabel
                  >
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
                  <template
                    v-else-if="field.type === 'select' && field.options"
                  >
                    <Select
                      v-bind="componentField"
                      :disabled="field.disabled"
                      class="w-full"
                    >
                      <FormControl>
                        <SelectTrigger class="w-full">
                          <SelectValue
                            :placeholder="
                              field.placeholder ||
                              t('placeholder.select_option')
                            "
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem
                            v-for="option in field.options"
                            :key="option.value"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </template>
                  <template v-else-if="field.type === 'date'">
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button
                          :id="field.name"
                          variant="outline"
                          :class="
                            cn(
                              'w-full justify-start text-left font-normal',
                              !fieldValue && 'text-muted-foreground',
                              field.disabled && 'cursor-not-allowed opacity-50'
                            )
                          "
                          type="button"
                          :disabled="field.disabled"
                        >
                          <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                          <span>{{
                            fieldValue
                              ? getFormattedDate(fieldValue)
                              : field.placeholder || t("placeholder.pick_date")
                          }}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent v-if="!field.disabled" class="w-auto p-0">
                        <FormControl>
                          <Calendar
                            initial-focus
                            :v-model="
                              fieldValue instanceof Date ? fieldValue : null
                            "
                            @update:model-value="
                              (v) => {
                                if (v) {
                                  setFieldValue(field.name, v.toString());
                                } else {
                                  setFieldValue(field.name, undefined);
                                }
                              }
                            "
                          />
                        </FormControl>
                      </PopoverContent>
                    </Popover>
                  </template>
                  <template v-else-if="field.type === 'checkbox'">
                    <FormControl>
                      <label
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        <Checkbox
                          :id="field.name"
                          v-bind="componentField"
                          :disabled="field.disabled"
                          :checked="fieldValue"
                        />
                        <span class="ml-2">{{ field.label }}</span>
                      </label>
                    </FormControl>
                  </template>
                  <template v-else-if="field.type === 'tags'">
                    <FormControl>
                      <TagsInput
                        :id="field.name"
                        :model-value="componentField.modelValue"
                        :disabled="field.disabled"
                        :placeholder="field.placeholder"
                        :delimiter="/[\n,]+/"
                        @update:model-value="
                          componentField['onUpdate:modelValue']
                        "
                      >
                        <TagsInputItem
                          v-for="tag in componentField.modelValue || []"
                          :key="tag"
                          :value="tag"
                        >
                          <TagsInputItemText />
                          <TagsInputItemDelete />
                        </TagsInputItem>
                        <TagsInputInput
                          :placeholder="
                            field.placeholder || t('placeholder.tags_input')
                          "
                        />
                      </TagsInput>
                    </FormControl>
                  </template>
                  <template v-else-if="field.type === 'file'">
                    <FormControl>
                      <Input
                        :id="field.name"
                        type="file"
                        :placeholder="field.placeholder"
                        :multiple="Boolean(field.props?.multiple)"
                        :accept="String(field.props?.accept || '')"
                        :disabled="field.disabled"
                        @change="(e: Event) => {
                          const input = e.target as HTMLInputElement;
                          if (input && componentField['onUpdate:modelValue']) {
                            componentField['onUpdate:modelValue'](input.files);
                          }
                        }"
                      />
                    </FormControl>
                  </template>
                  <FormMessage />
                </FormItem>
              </FormField>
            </template>
          </div>
        </div>
        <Separator />
      </div>
    </template>
  </form>
</template>
