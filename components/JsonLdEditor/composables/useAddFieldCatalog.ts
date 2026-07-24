import { computed, type Ref } from "vue";
import type { FieldDefinition } from "../types/editor.types";

interface UseAddFieldCatalogOptions {
  context: Ref<"dataset" | "distribution">;
  existingKeys: Ref<string[]>;
  searchQuery: Ref<string>;
  getAddableFields: (context: "dataset" | "distribution") => FieldDefinition[];
}

const CATEGORY_ORDER = [
  "identification",
  "provenance",
  "coverage",
  "access",
  "distribution",
] as const;

export const useAddFieldCatalog = ({
  context,
  existingKeys,
  searchQuery,
  getAddableFields,
}: UseAddFieldCatalogOptions) => {
  const allFields = computed(() => getAddableFields(context.value));

  const filteredFields = computed(() => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return allFields.value;

    return allFields.value.filter(
      (field) =>
        field.label.toLowerCase().includes(q) ||
        field.description?.toLowerCase().includes(q) ||
        field.key.toLowerCase().includes(q),
    );
  });

  const filteredGroupedFields = computed(() => {
    const groups: Record<string, FieldDefinition[]> = {};

    for (const field of filteredFields.value) {
      const category = field.category ?? "other";
      (groups[category] ??= []).push(field);
    }

    return CATEGORY_ORDER.filter((category) => groups[category]?.length).map(
      (category) => ({
        category,
        fields: groups[category],
      }),
    );
  });

  const isAlreadyAdded = (key: string) => existingKeys.value.includes(key);

  return {
    filteredGroupedFields,
    isAlreadyAdded,
  };
};
