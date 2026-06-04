import { findDatasetInJsonLd } from "~/utils/jsonld";
import {
  extractRelatedDataProduct,
  detectDatasetType,
  extractMetadataFilename,
} from "~/utils/catalogDataset";

interface UseCatalogShareOptions {
  getDataset: (id: string) => Promise<unknown>;
  saveDataset: (
    filename: string,
    dataset: string,
    options?: {
      relatedDataProduct?: string | null;
      isApplication?: boolean;
      showToast?: boolean;
    },
  ) => Promise<unknown>;
}

/**
 * Share / unshare a dataset by flipping `dspace:isShared` and re-saving the full
 * dataset JSON-LD through the same update-catalog endpoint the edit page uses
 * (`saveDataset` -> POST /datasets/{filename}/). Re-posting the object returned by
 * `getDataset` preserves every field (extra metadata, distributions, @context).
 */
export const useCatalogShare = ({
  getDataset,
  saveDataset,
}: UseCatalogShareOptions) => {
  const setDatasetShared = async (
    id: string,
    shared: boolean,
  ): Promise<boolean> => {
    const response = await getDataset(id);
    if (!response) return false;

    const ds =
      (findDatasetInJsonLd(response) as Record<string, unknown> | null) ??
      (response as Record<string, unknown>);

    ds["dspace:isShared"] = { "@type": "xsd:boolean", "@value": shared };

    const filename = extractMetadataFilename(ds) || id;
    const isApplication = detectDatasetType(ds) === "application";
    const relatedDataProduct = extractRelatedDataProduct(ds);

    const result = await saveDataset(filename, JSON.stringify(response), {
      relatedDataProduct,
      isApplication,
      showToast: false,
    });

    return !!result && (result as { error?: boolean }).error !== true;
  };

  return { setDatasetShared };
};
