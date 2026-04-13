<script setup lang="ts">
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
import Button from "@/components/ui/button/Button.vue";
import Input from "@/components/ui/input/Input.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import JsonLdEditor from "@/components/JsonLdEditor/index.vue";
import MmioUploadZone from "@/components/app/MmioUploadZone.vue";
import type {
  FormFieldDefinition,
  FormFieldOption,
} from "~/types/app-form.types";

interface Props {
  fields: FormFieldDefinition[];
  values: Record<string, unknown>;
  disabled?: boolean;
  isEditMode: boolean;
  fieldOptions: Record<string, FormFieldOption[]>;
  loadingOptions: Record<string, boolean>;
  displayedMmioFileName: string | null;
  uploadingFiles: Record<string, boolean>;
  fileInputKeys: Record<string, number>;
  mmioExtraMetadata: Array<Record<string, unknown>> | null;
  isFieldVisible: (field: FormFieldDefinition) => boolean;
  getFormattedDate: (date: unknown) => string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "set-field-value", fieldName: string, value: unknown): void;
  (e: "file-change", fieldName: string, file: File): void;
  (e: "file-delete", fieldName: string): void;
}>();

const { t } = useI18n();

const getItemType = (): string | undefined => {
  const raw = props.values.item_type;
  return typeof raw === "string" ? raw : undefined;
};
</script>

<template>
  <template v-for="field in fields" :key="field.name">
    <div v-if="field.type === 'client-selector' && isFieldVisible(field)">
      <AppClientSelector />
    </div>
    <FormField
      v-else-if="isFieldVisible(field)"
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
              :disabled="field.disabled || disabled"
            />
          </FormControl>
        </template>
        <template v-else-if="field.type === 'textarea'">
          <FormControl>
            <Textarea
              :id="field.name"
              :placeholder="field.placeholder"
              v-bind="componentField"
              :disabled="field.disabled || disabled"
              :rows="field.props?.rows || 3"
            />
          </FormControl>
        </template>
        <template v-else-if="field.type === 'select'">
          <Select
            v-bind="componentField"
            :disabled="
              field.disabled ||
              disabled ||
              loadingOptions[field.name] ||
              (isEditMode && field.name === 'item_type')
            "
            class="w-full"
          >
            <FormControl>
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="
                    loadingOptions[field.name]
                      ? t('placeholder.loading')
                      : field.placeholder || t('placeholder.select_option')
                  "
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="option in fieldOptions[field.name] || field.options || []"
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
                    (field.disabled || disabled) && 'cursor-not-allowed opacity-50',
                  )
                "
                type="button"
                :disabled="field.disabled || disabled"
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
              v-if="!(field.disabled || disabled)"
              class="w-auto p-0"
            >
              <FormControl>
                <Calendar
                  initial-focus
                  :v-model="fieldValue instanceof Date ? fieldValue : null"
                  @update:model-value="
                    (v) => {
                      if (v) {
                        emit('set-field-value', field.name, v.toString());
                      } else {
                        emit('set-field-value', field.name, undefined);
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
                :disabled="field.disabled || disabled"
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
              :disabled="field.disabled || disabled"
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
        <template v-else-if="field.type === 'jsonld-editor'">
          <FormControl>
            <JsonLdEditor
              :id="field.name"
              :model-value="componentField.modelValue"
              :readonly="field.disabled || disabled"
              :title="field.label"
              :extra-metadata="field.name === 'metadata_content' ? mmioExtraMetadata : null"
              :item-type="field.name === 'metadata_content' ? getItemType() : undefined"
              :enforce-client-access-url="field.name === 'metadata_content' ? !isEditMode : true"
              @update:model-value="componentField['onUpdate:modelValue']"
            />
          </FormControl>
        </template>
        <template v-else-if="field.type === 'file'">
          <FormControl>
            <MmioUploadZone
              :mmio-file="displayedMmioFileName"
              :uploading="uploadingFiles[field.name]"
              :disabled="field.disabled || disabled"
              :readonly="field.disabled || disabled"
              :input-key="fileInputKeys[field.name] || 0"
              @change-mmio="(file) => emit('file-change', field.name, file)"
              @remove-mmio="emit('file-delete', field.name)"
            />
          </FormControl>
        </template>
        <FormMessage />
        <p
          v-if="field.hint && !(field.disabled || disabled)"
          class="text-sm text-muted-foreground mt-1"
        >
          {{ field.hint }}
        </p>
      </FormItem>
    </FormField>
  </template>
</template>
