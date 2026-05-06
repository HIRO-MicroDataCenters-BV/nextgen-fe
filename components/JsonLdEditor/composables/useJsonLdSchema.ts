import { datasetSchema } from "../schema/dataset-schema";
import { distributionSchema } from "../schema/distribution-schema";
import {
  getAddableFields,
  getFieldDefinition,
  getMandatoryDatasetFieldKeys,
  getReadonlyFields,
  getRequiredFields,
} from "../schema/schema-accessors";

/**
 * DCAT-AP 3.0 compliant schema definitions for the JSON-LD editor.
 * Field trees live in `../schema/`; this composable exposes the same API as before.
 */
export function useJsonLdSchema() {
  return {
    datasetSchema,
    distributionSchema,
    getFieldDefinition,
    getRequiredFields,
    getMandatoryDatasetFieldKeys,
    getReadonlyFields,
    getAddableFields,
  };
}
