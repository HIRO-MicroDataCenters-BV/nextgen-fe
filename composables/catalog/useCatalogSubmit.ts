import type { ApiErrorDetail } from "~/types/api.types";

interface CatalogSubmitOptions {
  saveDataset: (
    filename: string,
    dataset: string,
    options?: { relatedDataProduct?: string | null; isApplication?: boolean },
  ) => Promise<unknown>;
}

export const normalizeCatalogErrorDetails = (
  payload: unknown,
): ApiErrorDetail[] => {
  const data =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : undefined;
  const detail = data?.detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail as ApiErrorDetail[];
  }
  if (typeof detail === "string" && detail) {
    return [{ message: detail }];
  }
  if (data?.message) {
    return [{ message: String(data.message) }];
  }
  return [{ message: "Server error occurred" }];
};

export const useCatalogSubmit = ({ saveDataset }: CatalogSubmitOptions) => {
  const saveCatalogItem = async ({
    filename,
    datasetJsonLd,
    relatedDataProduct,
    isApplication,
  }: {
    filename: string;
    datasetJsonLd: string;
    relatedDataProduct: string | null;
    isApplication: boolean;
  }) => {
    const result = await saveDataset(filename, datasetJsonLd, {
      relatedDataProduct,
      isApplication,
    });

    const maybeError = result as { error?: boolean; data?: unknown } | null;
    if (maybeError?.error === true) {
      return {
        ok: false as const,
        errors: normalizeCatalogErrorDetails(maybeError.data),
      };
    }

    if (!result) {
      return {
        ok: false as const,
        errors: normalizeCatalogErrorDetails(undefined),
      };
    }

    return { ok: true as const, result };
  };

  return { saveCatalogItem };
};
