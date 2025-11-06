<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import type { z } from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  TagsInput,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
} from "@/components/ui/tags-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Button from "@/components/ui/button/Button.vue";

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldDefinition {
  name: string;
  label: string;
  type: "text" | "select" | "date" | "textarea" | "checkbox" | "tags" | "file";
  placeholder?: string;
  hint?: string | null;
  options?: FormFieldOption[];
  validation?: z.ZodTypeAny;
  disabled?: boolean;
  accept?: string;
  props?: Record<string, unknown>;
  conditions?: Array<{
    field: string;
    value: unknown;
  }>;
}

export interface AppFormProps {
  fields: FormFieldDefinition[];
  initialValues?: Record<string, unknown>;
  formSchema: z.ZodObject<Record<string, z.ZodTypeAny>>;
  title?: string;
  description?: string;
  disabled?: boolean;
}

const props = defineProps<AppFormProps>();
const emit = defineEmits<{
  (e: "submit", values: Record<string, unknown>): void;
  (e: "cancel"): void;
}>();

const router = useRouter();
const { t } = useI18n();
const dayjs = useDayjs();
const df = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const typedSchema = computed(() => toTypedSchema(props.formSchema));

const { handleSubmit, values, meta, resetForm, setFieldValue } = useForm({
  validationSchema: typedSchema,
  initialValues: props.initialValues || {},
});

const showDiscardDialog = ref(false);
const hasChanges = computed(() => {
  if (!props.initialValues) return false;
  const initial = JSON.stringify(props.initialValues);
  const current = JSON.stringify(values);
  return initial !== current;
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

const onSubmit = handleSubmit((formData) => {
  emit("submit", formData);
});

const handleDiscard = () => {
  if (hasChanges.value) {
    showDiscardDialog.value = true;
  } else {
    router.back();
  }
};

const confirmDiscard = () => {
  showDiscardDialog.value = false;
  router.back();
};

const isFieldVisible = (field: FormFieldDefinition): boolean => {
  if (!field.conditions || field.conditions.length === 0) return true;
  return field.conditions.every((condition) => {
    const fieldValue = values[condition.field];
    return fieldValue === condition.value;
  });
};

defineExpose({
  submit: onSubmit,
  resetForm,
  values,
  meta,
});
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <div v-if="props.title || props.description" class="mb-6">
      <h2 v-if="props.title" class="text-2xl font-semibold mb-2">
        {{ props.title }}
      </h2>
      <p v-if="props.description" class="text-sm text-muted-foreground">
        {{ props.description }}
      </p>
    </div>
    <template v-for="field in fields" :key="field.name">
      <FormField
        v-if="isFieldVisible(field)"
        v-slot="{ componentField, value: fieldValue }"
        :name="field.name"
      >
        <FormItem>
          <FormLabel v-if="field.type !== 'checkbox'" :for="field.name">{{
            field.label
          }}</FormLabel>
          <template v-if="field.type === 'text'">
            <FormControl>
              <Input
                :id="field.name"
                type="text"
                :placeholder="field.placeholder"
                v-bind="componentField"
                :disabled="field.disabled || props.disabled"
              />
            </FormControl>
          </template>
          <template v-else-if="field.type === 'textarea'">
            <FormControl>
              <Textarea
                :id="field.name"
                :placeholder="field.placeholder"
                v-bind="componentField"
                :disabled="field.disabled || props.disabled"
                :rows="field.props?.rows || 3"
              />
            </FormControl>
          </template>
          <template v-else-if="field.type === 'select' && field.options">
            <Select
              v-bind="componentField"
              :disabled="field.disabled"
              class="w-full"
            >
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue
                    :placeholder="
                      field.placeholder || t('placeholder.select_option')
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
                      (field.disabled || props.disabled) &&
                        'cursor-not-allowed opacity-50'
                    )
                  "
                  type="button"
                  :disabled="field.disabled || props.disabled"
                >
                  <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                  <span>{{
                    fieldValue
                      ? getFormattedDate(fieldValue)
                      : field.placeholder || t("placeholder.pick_date")
                  }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                v-if="!(field.disabled || props.disabled)"
                class="w-auto p-0"
              >
                <FormControl>
                  <Calendar
                    initial-focus
                    :v-model="fieldValue instanceof Date ? fieldValue : null"
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
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <Checkbox
                  :id="field.name"
                  v-bind="componentField"
                  :disabled="field.disabled || props.disabled"
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
                :disabled="field.disabled || props.disabled"
                :placeholder="field.placeholder"
                :delimiter="/[\n,]+/"
                @update:model-value="componentField['onUpdate:modelValue']"
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
                :accept="field.accept || String(field.props?.accept || '')"
                :disabled="field.disabled || props.disabled"
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
          <p v-if="field.hint" class="text-sm text-muted-foreground mt-1">
            {{ field.hint }}
          </p>
        </FormItem>
      </FormField>
    </template>

    <div class="actions flex justify-start gap-2 pt-4">
      <Button
        type="button"
        variant="outline"
        :disabled="props.disabled"
        @click="handleDiscard"
      >
        {{ t("action.discard") }}
      </Button>
      <Button type="submit" :disabled="props.disabled">
        {{ t("action.save") }}
      </Button>
    </div>
  </form>

  <AlertDialog
    :open="showDiscardDialog"
    @update:open="showDiscardDialog = $event"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("title.unsaved_changes") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("alert.unsaved_changes_description") }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t("action.cancel") }}</AlertDialogCancel>
        <AlertDialogAction variant="destructive" @click="confirmDiscard">
          {{ t("action.discard") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
