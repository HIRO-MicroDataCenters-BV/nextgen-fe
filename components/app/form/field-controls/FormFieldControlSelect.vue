<script setup lang="ts">
import { FormControl } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  FormFieldDefinition,
  FormFieldOption,
} from "~/types/app-form.types";

const props = defineProps<{
  field: FormFieldDefinition;
  disabled: boolean;
  isEditMode: boolean;
  fieldOptions: Record<string, FormFieldOption[]>;
  loadingOptions: Record<string, boolean>;
  componentField: object;
}>();

const { t } = useI18n();

const optionsList = computed(
  () => props.fieldOptions[props.field.name] || props.field.options || [],
);
</script>

<template>
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
          v-for="option in optionsList"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
