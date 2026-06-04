import * as jsonld from "jsonld";
import type {
  SearchFilter,
  SearchResponse,
  JsonLdObject,
  CatalogDataset,
  CatalogResponse,
  ApiFilterGroup,
} from "~/types/api.types";
import {
  findDatasetInJsonLd,
  normalizeDctermsLanguageLiteral,
} from "~/utils/jsonld";
import {
  catalogDatasetSchema,
  catalogSearchResponseSchema,
} from "~/schemas/catalog.schema";
import {
  createApiRequest,
  type RequestError,
} from "~/composables/api/createApiRequest";

export const useApi = () => {
  const config = useRuntimeConfig();
  const { t } = useI18n();

  const serviceUrls = {
    search: config.public.apiSearchServiceUrl,
    catalog: config.public.apiCatalogServiceUrl,
    connector: config.public.apiConnectorServiceURL,
  };

  const accessTokenKey = "access_token";
  const token = useLocalStorage(accessTokenKey, null);
  const toaster = useToaster();
  const isRequestError = (value: unknown): value is RequestError =>
    !!value &&
    typeof value === "object" &&
    "error" in value &&
    (value as { error?: unknown }).error === true;

  const cloneAndSanitizeDataset = <T extends Record<string, unknown>>(
    payload: T,
  ): T => {
    const cloned = structuredClone(payload);
    const dataset = findDatasetInJsonLd(cloned) ?? (cloned as Record<string, unknown>);
    if (dataset["dcterms:title"] != null) {
      dataset["dcterms:title"] = normalizeDctermsLanguageLiteral(
        dataset["dcterms:title"],
        "en",
      );
    }
    return cloned as T;
  };

  const validateCatalogPayload = <T extends Record<string, unknown>>(
    payload: unknown,
    kind: "dataset" | "catalog"
  ): T | null => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }

    const parsed =
      kind === "dataset"
        ? catalogDatasetSchema.safeParse(payload)
        : catalogSearchResponseSchema.safeParse(payload);

    if (parsed.success) {
      return parsed.data as T;
    }

    if (import.meta.dev) {
      console.warn(`[useApi] Invalid ${kind} payload`, parsed.error.flatten());
    }
    toaster.show("error", t("app.error.fetch"));
    return null;
  };

  const { request } = createApiRequest({
    serviceUrls,
    token,
    toaster,
    t,
  });

  async function prepareSearchFilter(
    filter: SearchFilter
  ): Promise<SearchFilter> {
    if (!filter.filters) {
      filter.filters = [];
    }

    const compacted = (await jsonld.compact(
      filter,
      filter["@context"]
    )) as JsonLdObject;

    const result: SearchFilter = {
      "@context": filter["@context"],
      "@type": "Filters",
      filters: Array.isArray(compacted.filters)
        ? (compacted.filters as Array<{
          "@type": string;
          [key: string]: unknown;
        }>)
        : compacted.filters
          ? [compacted.filters as { "@type": string;[key: string]: unknown }]
          : [],
    };

    return result;
  }

  return {
    healthCheck: async () => {
      return request<{ status: string }>("search", `/health-check`);
    },

    getConnectorMetadata: async () => {
      const response = await request<{
        connector_id: string;
        region: string;
        supported_interfaces: string[];
        status: string;
        version: string;
      }>("connector", `/connector-metadata`, "GET", undefined, { showToast: false });
      if (!response || isRequestError(response)) return null;
      return response;
    },

    getMetrics: async () => {
      return request<Record<string, unknown>>("search", `/metrics`);
    },

    searchLocalCatalog: async (filter: SearchFilter) => {
      const preparedFilter = await prepareSearchFilter(filter);
      return request<SearchResponse>(
        "search",
        `/search-catalog/`,
        "POST",
        preparedFilter
      );
    },

    searchDecentralized: async (filter: SearchFilter) => {
      const preparedFilter = await prepareSearchFilter(filter);
      return request<SearchResponse>(
        "search",
        `/search/`,
        "POST",
        preparedFilter
      );
    },

    searchDistributed: async (filter: SearchFilter) => {
      const preparedFilter = await prepareSearchFilter(filter);
      return request<SearchResponse>(
        "search",
        `/distributed-search/`,
        "POST",
        preparedFilter
      );
    },

    createFilter: (
      context: Record<string, string>,
      filters: Array<Record<string, unknown>>
    ): SearchFilter => {
      return {
        "@context": {
          "@vocab": "http://data-space.org/",
          ...context,
        },
        "@type": "Filters",
        filters,
      };
    },

    getFilters: async () => {
      const response = await request<{ groups: ApiFilterGroup[] }>(
        "catalog",
        "/catalog/filters/",
        "GET",
        undefined,
        { showToast: false }
      );
      if (!response || isRequestError(response)) return [];
      return response?.groups ?? [];
    },

    getLocalCatalog: async (
      filter: SearchFilter
    ): Promise<CatalogResponse | null> => {
      const preparedFilter = await prepareSearchFilter(filter);
      const response = await request<CatalogResponse>(
        "catalog",
        "/catalog/",
        "POST",
        preparedFilter
      );
      if (!response || isRequestError(response)) return null;
      return validateCatalogPayload<CatalogResponse>(response, "catalog");
    },

    getDataset: async (id: string): Promise<CatalogDataset | null> => {
      const response = await request<CatalogDataset>(
        "catalog",
        `/datasets/${id}/`,
        "GET"
      );
      if (!response || isRequestError(response)) return null;
      const dataset = validateCatalogPayload<CatalogDataset>(
        response,
        "dataset"
      );
      if (!dataset) return null;
      return cloneAndSanitizeDataset(dataset);
    },

    saveDataset: async (
      filename: string,
      dataset: string,
      options?: {
        relatedDataProduct?: string | null;
        isApplication?: boolean;
        showToast?: boolean;
      }
    ): Promise<CatalogDataset | { error: true; data: unknown } | null> => {
      let url = `/datasets/${filename}/`;

      // Only add related_data_product if it has a value (for datasets only)
      if (
        !options?.isApplication &&
        options?.relatedDataProduct &&
        options.relatedDataProduct.trim()
      ) {
        const encodedParam = encodeURIComponent(options.relatedDataProduct);
        url += `?related_data_product=${encodedParam}`;
      }

      const response = await request<CatalogDataset | RequestError>(
        "catalog",
        url,
        "POST",
        dataset,
        {
          showToast: options?.showToast ?? true,
          hasRawData: true,
          returnErrorDetails: true,
        }
      );
      if (response && !isRequestError(response)) {
        const dataset = validateCatalogPayload<CatalogDataset>(
          response,
          "dataset"
        );
        if (!dataset) return null;
        return cloneAndSanitizeDataset(dataset);
      }
      if (isRequestError(response)) return response;
      return response ?? null;
    },

    deleteDataset: async (
      id: string,
      options?: { showToast?: boolean }
    ): Promise<boolean> => {
      const response = await request<null>(
        "catalog",
        `/datasets/${id}/`,
        "DELETE",
        undefined,
        { showToast: options?.showToast }
      );
      return response !== null;
    },

    uploadMmioFile: async (
      file: File,
      options?: { showToast?: boolean }
    ): Promise<string | null> => {
      const formData = new FormData();
      formData.append("file", file);

      const result = await request<string>(
        "catalog",
        "/mmio/",
        "POST",
        formData,
        {
          showToast: options?.showToast,
        }
      );
      if (isRequestError(result)) return null;
      return result ?? null;
    },

    getMmioFile: async (filename: string): Promise<Blob | null> => {
      const response = await request<Blob>(
        "catalog",
        `/mmio/${filename}/`,
        "GET",
        undefined,
        { showToast: true }
      );
      if (isRequestError(response)) return null;
      return response || null;
    },

    deleteMmioFile: async (filename: string): Promise<boolean> => {
      const response = await request<null>(
        "catalog",
        `/mmio/${filename}/`,
        "DELETE"
      );
      return response !== null;
    },

    getDataproducts: async (interfaceId?: string): Promise<{ dataproducts: string[] } | null> => {
      const id = interfaceId || "local";
      const response = await request<{ dataproducts: string[] }>(
        "connector",
        `/dataproducts/${id}`,
        "GET"
      );
      if (isRequestError(response)) return null;
      return response || null;
    },

    checkout: async (
      datasets: Array<Record<string, unknown>>,
      options?: { showToast?: boolean }
    ): Promise<{
      order_id: string;
      status: string;
    } | null> => {
      const showToast = options?.showToast !== false;
      try {
        const response = await $fetch<{
          order_id: string;
          status: string;
        }>("/api/marketplace/checkout", {
          method: "POST",
          body: { datasets },
        });
        return response;
      } catch (error: unknown) {
        if (showToast) {
          const errorMessage =
            (error as { data?: { statusMessage?: string } })?.data
              ?.statusMessage || t("app.error.fetch");
          toaster.show("error", errorMessage);
        }
        return null;
      }
    },

    training: {
      run: async (
        datasets: Array<Record<string, unknown>>,
        orderId: string,
        options?: { showToast?: boolean }
      ): Promise<unknown | null> => {
        const showToast = options?.showToast !== false;
        try {
          const response = await $fetch("/api/training/run", {
            method: "POST",
            body: { datasets, order_id: orderId },
          });
          return response;
        } catch (error: unknown) {
          if (showToast) {
            const errorMessage =
              (error as { data?: { statusMessage?: string } })?.data
                ?.statusMessage || t("app.error.training");
            toaster.show("error", errorMessage);
          }
          return null;
        }
      },
    },
  };
};
