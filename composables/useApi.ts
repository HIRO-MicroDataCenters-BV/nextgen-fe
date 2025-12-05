import * as jsonld from "jsonld";
import type {
  SearchFilter,
  SearchResponse,
  JsonLdObject,
  CatalogDataset,
  CatalogResponse,
  ApiError,
} from "~/types/api.types";

/**
 * Fetch data from the API
 * @returns returns the API object
 */
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

  /**
   * Function to get headers
   * @param isFormData
   * @returns
   */
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

  /**
   * Function to make a request
   * @param url
   * @param method
   * @param body
   * @returns
   */
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

  /**
   * Prepare search filter with proper JSON-LD context
   */
  async function prepareSearchFilter(
    filter: SearchFilter
  ): Promise<SearchFilter> {
    // Ensure filters array exists
    if (!filter.filters) {
      filter.filters = [];
    }

    // Compact the filter
    const compacted = (await jsonld.compact(
      filter,
      filter["@context"]
    )) as JsonLdObject;

    // Create a new filter object with the compacted data
    const result: SearchFilter = {
      "@context": filter["@context"],
      "@type": "Filters",
      filters: Array.isArray(compacted.filters)
        ? (compacted.filters as Array<{
            "@type": string;
            [key: string]: unknown;
          }>)
        : compacted.filters
        ? [compacted.filters as { "@type": string; [key: string]: unknown }]
        : [],
    };

    return result;
  }

  return {
    /**
     * Performs a health check of the search service
     * @returns Promise with the service status
     * @example
     * const api = useApi();
     * const status = await api.healthCheck();
     */
    healthCheck: async () => {
      return request<{ status: string }>("search", `/health-check`);
    },

    /**
     * Retrieves metrics from the search service
     * @returns Promise with service metrics data
     * @example
     * const api = useApi();
     * const metrics = await api.getMetrics();
     */
    getMetrics: async () => {
      return request<Record<string, unknown>>("search", `/metrics`);
    },

    /**
     * Searches the local catalog using provided filters
     * @param filter - Search filter object with JSON-LD context
     * @returns Promise with search results
     * @example
     * const api = useApi();
     * const results = await api.searchLocalCatalog({
     *   "@context": { "@vocab": "http://data-space.org/" },
     *   "@type": "Filters",
     *   filters: []
     * });
     */
    searchLocalCatalog: async (filter: SearchFilter) => {
      const preparedFilter = await prepareSearchFilter(filter);
      return request<SearchResponse>(
        "search",
        `/search-catalog/`,
        "POST",
        preparedFilter
      );
    },

    /**
     * Performs a decentralized search across multiple catalogs
     * @param filter - Search filter object with JSON-LD context
     * @returns Promise with search results from multiple catalogs
     * @example
     * const api = useApi();
     * const results = await api.searchDecentralized({
     *   "@context": { "@vocab": "http://data-space.org/" },
     *   "@type": "Filters",
     *   filters: []
     * });
     */
    searchDecentralized: async (filter: SearchFilter) => {
      const preparedFilter = await prepareSearchFilter(filter);
      return request<SearchResponse>(
        "search",
        `/search/`,
        "POST",
        preparedFilter
      );
    },

    /**
     * Performs a distributed search across federated catalogs
     * @param filter - Search filter object with JSON-LD context
     * @returns Promise with search results from distributed catalogs
     * @example
     * const api = useApi();
     * const results = await api.searchDistributed({
     *   "@context": { "@vocab": "http://data-space.org/" },
     *   "@type": "Filters",
     *   filters: []
     * });
     */
    searchDistributed: async (filter: SearchFilter) => {
      const preparedFilter = await prepareSearchFilter(filter);
      return request<SearchResponse>(
        "search",
        `/distributed-search/`,
        "POST",
        preparedFilter
      );
    },

    /**
     * Creates a basic search filter with the provided context and filters
     * @param context - JSON-LD context object
     * @param filters - Array of filter objects
     * @returns SearchFilter object
     * @example
     * const api = useApi();
     * const filter = api.createFilter(
     *   { "dcat": "http://www.w3.org/ns/dcat#" },
     *   [{ "type": "Dataset" }]
     * );
     */
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

    /**
     * Retrieves the local catalog with optional filtering
     * @param filter - Optional search filter to apply
     * @returns Promise with catalog data or null if error occurs
     * @example
     * const api = useApi();
     * const catalog = await api.getLocalCatalog();
     */
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

    /**
     * Retrieves a specific dataset by its ID
     * @param id - Dataset identifier
     * @returns Promise with dataset data or null if not found
     * @example
     * const api = useApi();
     * const dataset = await api.getDataset("dataset-123");
     */
    getDataset: async (id: string): Promise<CatalogDataset | null> => {
      const response = await request<CatalogDataset>(
        "catalog",
        `/datasets/${id}/`,
        "GET"
      );
      return response || null;
    },

    /**
     * Creates or updates a dataset
     * @param filename - Name of the dataset file
     * @param dataset - Dataset data in JSON-LD format
     * @param relatedDataProduct - Optional related data product path
     * @returns Promise with updated dataset data or null if error occurs
     * @example
     * const api = useApi();
     * const updated = await api.saveDataset("my-dataset", datasetData, "path/to/product");
     */
    saveDataset: async (
      filename: string,
      dataset: string,
      relatedDataProduct?: string | null
    ): Promise<CatalogDataset | null> => {
      // Build URL with properly encoded query parameter
      let url = `/datasets/${filename}/`;
      if (relatedDataProduct !== null && relatedDataProduct !== undefined) {
        const encodedParam = encodeURIComponent(relatedDataProduct);
        url += `?related_data_product=${encodedParam}`;
      } else {
        // Backend requires this parameter, so pass empty string if not provided
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

    /**
     * Deletes a dataset by its ID
     * @param id - Dataset identifier
     * @returns Promise with boolean indicating success
     * @example
     * const api = useApi();
     * const success = await api.deleteDataset("dataset-123");
     */
    deleteDataset: async (id: string): Promise<boolean> => {
      const response = await request<null>(
        "catalog",
        `/datasets/${id}/`,
        "DELETE"
      );
      return response !== null;
    },

    /**
     * Shares a dataset, making it publicly available
     * @param id - Dataset identifier
     * @returns Promise with boolean indicating success
     * @example
     * const api = useApi();
     * const success = await api.shareDataset("dataset-123");
     */
    shareDataset: async (id: string): Promise<boolean> => {
      const response = await request<null>(
        "catalog",
        `/datasets/${id}/share/`,
        "POST"
      );
      return response !== null;
    },

    /**
     * Unshares a dataset, making it private
     * @param id - Dataset identifier
     * @returns Promise with boolean indicating success
     * @example
     * const api = useApi();
     * const success = await api.unshareDataset("dataset-123");
     */
    unshareDataset: async (id: string): Promise<boolean> => {
      const response = await request<null>(
        "catalog",
        `/datasets/${id}/unshare/`,
        "POST"
      );
      return response !== null;
    },

    /**
     * Uploads a MMIO file to the catalog service
     * @param file - File to upload
     * @param options - Optional configuration
     * @returns Promise with file location URL or null if upload fails
     * @example
     * const api = useApi();
     * const file = new File(["content"], "file.mmio");
     * const location = await api.uploadMmioFile(file);
     */
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

    /**
     * Retrieves a MMIO file by its filename
     * @param filename - Name of the MMIO file
     * @returns Promise with file Blob or null if not found
     * @example
     * const api = useApi();
     * const file = await api.getMmioFile("file.mmio");
     */
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

    /**
     * Deletes a MMIO file by its filename
     * @param filename - Name of the MMIO file
     * @returns Promise with boolean indicating success
     * @example
     * const api = useApi();
     * const success = await api.deleteMmioFile("file.mmio");
     */
    deleteMmioFile: async (filename: string): Promise<boolean> => {
      const response = await request<null>(
        "catalog",
        `/mmio/${filename}/`,
        "DELETE"
      );
      return response !== null;
    },

    /**
     * Gets list of dataproducts from connector service
     * @returns Promise with dataproducts response object or null if error occurs
     * @example
     * const api = useApi();
     * const response = await api.getDataproducts();
     */
    getDataproducts: async (): Promise<{ dataproducts: string[] } | null> => {
      const response = await request<{ dataproducts: string[] }>(
        "connector",
        "/file",
        "GET"
      );
      return response || null;
    },

    /**
     * const response = await api.runFederatedTraining([{ identifier: "dataset-1" }]);
     */
    runFederatedTraining: async (
      datasets: Array<Record<string, unknown>>,
      options?: { showToast?: boolean }
    ): Promise<{
      status_code: number;
      message: string;
      data: {
        id: string;
        pipeline_name: string;
        order_id: string;
        status: string;
      };
    } | null> => {
      const showToast = options?.showToast !== false;
      try {
        const response = await $fetch<{
          status_code: number;
          message: string;
          data: {
            id: string;
            pipeline_name: string;
            order_id: string;
            status: string;
          };
        }>("/api/training/run", {
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
  };
};
