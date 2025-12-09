import * as jsonld from "jsonld";
import type {
  SearchFilter,
  SearchResponse,
  JsonLdObject,
  CatalogDataset,
  CatalogResponse,
  ApiError,
} from "~/types/api.types";

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

  const getHeaders = (isFormData: boolean = false) => {
    const headers: {
      "Content-Type"?: string;
      Authorization?: string;
      Accept?: string;
    } = {
      Accept: "application/ld+json",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  };

  const request = async <T>(
    service: "search" | "catalog" | "connector",
    url: string,
    method: string = "GET",
    body?: unknown,
    options?: {
      showToast?: boolean;
      timeout?: number;
      hasRawData?: boolean;
      returnResponse?: boolean;
    }
  ) => {
    const baseUrl = serviceUrls[service];
    const isFormData = body instanceof FormData;
    const hasRawData = options?.hasRawData || false;
    const showToast = options?.showToast !== false;
    const timeout = options?.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const opts: RequestInit = {
      method,
      headers: getHeaders(isFormData),
      signal: controller.signal,
      ...(method !== "DELETE" &&
        method !== "GET" && {
        body: isFormData
          ? (body as BodyInit)
          : hasRawData
            ? (body as BodyInit)
            : JSON.stringify(body),
      }),
    };

    try {
      const res = await fetch(`${baseUrl}${url}`, opts);
      clearTimeout(timeoutId);

      let data = {};
      const text = await res.text();
      if (text != "") {
        data = JSON.parse(text);
      }

      if (!res.ok) {
        const error = data as ApiError;
        const errorMessage = error.detail || t("app.error.occurred");
        switch (res.status) {
          case 401:
            token.value = null;
            if (showToast) {
              toaster.show("error", t("app.error.unauthorized"));
            }
            return null;
          default:
            if (showToast) {
              toaster.show("error", errorMessage);
            }
            return null;
        }
      }

      if (isFormData && (res.status === 201 || res.status === 200)) {
        const locationHeader = res.headers.get("Location");
        if (locationHeader) {
          return locationHeader as T;
        }

        if (data && typeof data === "object" && "Location" in data) {
          return (data as { Location: string }).Location as T;
        }

        if (body instanceof FormData) {
          const file = body.get("file") as File;
          if (file) {
            return file.name as T;
          }
        }
      }

      if (options?.returnResponse) {
        return { data: data as T, response: res } as unknown as T & {
          response: Response;
        };
      }

      return data as T;
    } catch (err) {
      if (method === "DELETE") {
        return;
      }

      if (err instanceof Error && err.name === "AbortError") {
        if (showToast) {
          toaster.show("error", t("app.error.timeout"));
        }
        return null;
      }

      if (showToast) {
        toaster.show("error", t("app.error.fetch"));
      }
      return null;
    }
  };

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
      return response || null;
    },

    getDataset: async (id: string): Promise<CatalogDataset | null> => {
      const response = await request<CatalogDataset>(
        "catalog",
        `/datasets/${id}/`,
        "GET"
      );
      return response || null;
    },

    saveDataset: async (
      filename: string,
      dataset: string,
      relatedDataProduct?: string | null
    ): Promise<CatalogDataset | null> => {
      let url = `/datasets/${filename}/`;
      if (relatedDataProduct !== null && relatedDataProduct !== undefined) {
        const encodedParam = encodeURIComponent(relatedDataProduct);
        url += `?related_data_product=${encodedParam}`;
      } else {
        url += `?related_data_product=`;
      }

      const response = await request<CatalogDataset>(
        "catalog",
        url,
        "POST",
        dataset,
        { showToast: true, hasRawData: true }
      );
      return response || null;
    },

    deleteDataset: async (id: string): Promise<boolean> => {
      const response = await request<null>(
        "catalog",
        `/datasets/${id}/`,
        "DELETE"
      );
      return response !== null;
    },

    shareDataset: async (id: string): Promise<boolean> => {
      const response = await request<null>(
        "catalog",
        `/datasets/${id}/share/`,
        "POST"
      );
      return response !== null;
    },

    unshareDataset: async (id: string): Promise<boolean> => {
      const response = await request<null>(
        "catalog",
        `/datasets/${id}/unshare/`,
        "POST"
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

    getDataproducts: async (): Promise<{ dataproducts: string[] } | null> => {
      const response = await request<{ dataproducts: string[] }>(
        "connector",
        "/file",
        "GET"
      );
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
