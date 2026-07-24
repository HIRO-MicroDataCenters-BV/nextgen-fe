import type { FieldDefinition } from "../types/editor.types";
import { datasetSchema } from "./dataset-schema";
import { distributionSchema } from "./distribution-schema";

export const getFieldDefinition = (
  key: string,
  context: "dataset" | "distribution" = "dataset",
): FieldDefinition | undefined => {
  const schema = context === "dataset" ? datasetSchema : distributionSchema;

  const searchSchema = (
    fields: Record<string, FieldDefinition>,
  ): FieldDefinition | undefined => {
    if (fields[key]) return fields[key];
    for (const fieldDef of Object.values(fields)) {
      if (fieldDef.children) {
        const found = searchSchema(fieldDef.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  return searchSchema(schema);
};

export const getRequiredFields = (
  context: "dataset" | "distribution" = "dataset",
): string[] => {
  const schema = context === "dataset" ? datasetSchema : distributionSchema;
  return Object.entries(schema)
    .filter(([_, def]) => def.required)
    .map(([fieldKey]) => fieldKey);
};

/** Top-level dataset keys that are DCAT-AP mandatory (used for presence checks, excludes hidden/system). */
export const getMandatoryDatasetFieldKeys = (): string[] =>
  Object.entries(datasetSchema)
    .filter(
      ([_, def]) =>
        def.dcatApCompliance === "mandatory" &&
        !def.hidden &&
        !def.autoGenerate,
    )
    .map(([fieldKey]) => fieldKey);

export const getReadonlyFields = (): string[] =>
  Object.entries(datasetSchema)
    .filter(([_, def]) => def.readonly)
    .map(([fieldKey]) => fieldKey);

/**
 * Returns all fields available for the DCAT-AP guided "Add Field" picker.
 * Excludes hidden/technical fields.
 */
export const getAddableFields = (
  context: "dataset" | "distribution" = "dataset",
): FieldDefinition[] => {
  const schema = context === "dataset" ? datasetSchema : distributionSchema;
  return Object.values(schema).filter((def) => !def.hidden && !def.readonly);
};
