import { useJsonLdSchema } from "./useJsonLdSchema";
import { useJsonLdTransform } from "./useJsonLdTransform";
import { createDefaultDatasetBuilder } from "../default-dataset/createDefaultDatasetBuilder";

/**
 * Builds the default DCAT-AP 3 dataset tree with mandatory and recommended
 * fields pre-populated as empty nodes so the editor never starts blank.
 */
export function useDefaultDataset() {
  const { datasetSchema, distributionSchema } = useJsonLdSchema();
  const { createDefaultNode, serializeJsonLd } = useJsonLdTransform();

  return createDefaultDatasetBuilder({
    datasetSchema,
    distributionSchema,
    createDefaultNode,
    serializeJsonLd,
  });
}
