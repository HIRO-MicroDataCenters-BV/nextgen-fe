import { ref } from "vue";
import type { Ref } from "vue";
import type {
  FormFieldDefinition,
  FormFieldOption,
} from "~/types/app-form.types";

const getNestedValue = (obj: unknown, path: string): unknown => {
  if (!path) return obj;
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (
      current &&
      typeof current === "object" &&
      key in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  return current;
};

export const useDynamicFieldOptions = ({
  fields,
  values,
  initialValues,
  isEditMode,
  setFieldValue,
}: {
  fields: Ref<FormFieldDefinition[]>;
  values: Record<string, unknown>;
  initialValues?: Record<string, unknown>;
  isEditMode: Ref<boolean>;
  setFieldValue: (field: string, value: unknown) => void;
}) => {
  const fieldOptions = ref<Record<string, FormFieldOption[]>>({});
  const loadingOptions = ref<Record<string, boolean>>({});

  const loadFieldOptions = async (field: FormFieldDefinition) => {
    if (!field.dataSource || field.type !== "select") return;
    if (loadingOptions.value[field.name]) return;
    loadingOptions.value[field.name] = true;
    try {
      const response = await field.dataSource();
      const dataPath = field.fieldOptions?.dataPath;
      const rawData = dataPath ? getNestedValue(response, dataPath) : response;
      if (!Array.isArray(rawData)) return;

      const valueKey = field.fieldOptions?.valueKey || "value";
      const labelKey = field.fieldOptions?.labelKey || "label";
      fieldOptions.value[field.name] = rawData.map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return { value: String(item), label: String(item) };
        }
        if (item && typeof item === "object") {
          const itemObj = item as Record<string, unknown>;
          return {
            value: String(itemObj[valueKey] ?? ""),
            label: String(itemObj[labelKey] ?? itemObj[valueKey] ?? ""),
          };
        }
        return { value: String(item), label: String(item) };
      });

      const rawCurrent = values[field.name];
      const currentStr = typeof rawCurrent === "string" ? rawCurrent.trim() : "";
      const rawInitial = initialValues?.[field.name];
      const initialStr = typeof rawInitial === "string" ? rawInitial.trim() : "";
      const valToEnsure = currentStr || initialStr;
      const currentOptions = fieldOptions.value[field.name] ?? [];
      if (
        isEditMode.value &&
        valToEnsure &&
        !currentOptions.some((o) => o.value === valToEnsure)
      ) {
        fieldOptions.value[field.name] = [
          { value: valToEnsure, label: valToEnsure },
          ...currentOptions,
        ];
      }
    } finally {
      loadingOptions.value[field.name] = false;
    }
  };

  const refreshFieldOptions = (
    fieldName: string,
    opts?: { preserveValue?: boolean },
  ) => {
    const field = fields.value.find((f) => f.name === fieldName);
    if (field?.dataSource && field.type === "select") {
      if (!opts?.preserveValue) setFieldValue(fieldName, null);
      void loadFieldOptions(field);
    }
  };

  return { fieldOptions, loadingOptions, loadFieldOptions, refreshFieldOptions };
};
