import {
  apiErrorResponseSchema,
  apiResponseSchema,
} from "~/schemas/response.schema";
import * as jsonld from "jsonld";

// Types for API
interface SearchFilter {
  "@context": {
    "@vocab": string;
    [key: string]: string;
  };
  "@type": "Filters";
  filters: Array<{
    [key: string]: any;
  }>;
}

interface SearchResponse {
  "@context": {
    "@vocab": string;
    [key: string]: string;
  };
  "@type": string;
  results: Array<any>;
  metadata?: {
    total: number;
    page: number;
    pageSize: number;
    catalogs: Array<{
      id: string;
      status: "success" | "error";
      error?: string;
    }>;
  };
}

type JsonLdObject = {
  "@context": Record<string, any>;
  "@type"?: string;
  [key: string]: any;
};

/**
 * Fetch data from the API
 * @returns returns the API object
 */
export const useApi = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiSearchServiceUrl;
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
      headers["Content-Type"] = "application/ld+json";
    }

    // Authentication is disabled but kept in code
    // if (token.value) {
    //   headers["Authorization"] = `Bearer ${token.value}`;
    // }

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
    url: string,
    method: string = "GET",
    body?: unknown,
    options?: {
      showToast?: boolean;
      retryCount?: number;
      timeout?: number;
    }
  ) => {
    const isFormData = body instanceof FormData;
    const showToast = options?.showToast !== false;
    const retryCount = options?.retryCount || 3;
    const timeout = options?.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const opts: RequestInit = {
      method,
      headers: getHeaders(isFormData),
      signal: controller.signal,
      ...(method !== "DELETE" &&
        method !== "GET" && {
          body: isFormData ? body : JSON.stringify(body),
        }),
    };

    try {
      const res = await fetch(`${baseUrl}${url}`, opts);
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        switch (res.status) {
          case 401:
            token.value = null;
            if (showToast) {
              toaster.show("error", "Unauthorized access. Please login again.");
            }
            return null;
          case 422:
            if (showToast) {
              toaster.show("error", data.detail);
            }
            return null;
          case 503:
            if (showToast) {
              toaster.show("error", data.detail);
            }
            return null;
          default:
            if (showToast) {
              toaster.show("error", `HTTP error! status: ${res.status}`);
            }
            return null;
        }
      }

      const result =
        res.status >= 400 && res.status < 600
          ? apiErrorResponseSchema.parse(data)
          : apiResponseSchema.parse(data);
      return result as T;
    } catch (err) {
      if (method === "DELETE") {
        return;
      }

      if (err instanceof Error && err.name === "AbortError") {
        if (showToast) {
          toaster.show("error", "Request timeout");
        }
        return null;
      }

      console.error("Fetch error:", err);
      if (showToast) {
        toaster.show("error", "An error occurred while fetching data");
      }
      return null;
    }
  };

  /**
   * Prepare search filter with proper JSON-LD context
   */
  const prepareSearchFilter = async (
    filter: SearchFilter
  ): Promise<SearchFilter> => {
    // Compact the filter using the context
    const compacted = (await jsonld.compact(
      filter,
      filter["@context"]
    )) as JsonLdObject;
    return {
      "@context": filter["@context"],
      "@type": "Filters",
      filters: Array.isArray(compacted.filters) ? compacted.filters : [],
    };
  };

  return {
    // Health check
    healthCheck: async () => {
      return request<{ status: string }>(`/health-check`);
    },

    // Metrics
    getMetrics: async () => {
      return request<Record<string, any>>(`/metrics`);
    },

    // Local search
    searchLocalCatalog: async (filter: SearchFilter) => {
      const preparedFilter = await prepareSearchFilter(filter);
      return request<SearchResponse>(
        `/search-catalog/`,
        "POST",
        preparedFilter
      );
    },

    // Decentralized search
    searchDecentralized: async (filter: SearchFilter) => {
      const preparedFilter = await prepareSearchFilter(filter);
      return request<SearchResponse>(`/search/`, "POST", preparedFilter);
    },

    // Helper method to create a basic filter
    createFilter: (
      context: Record<string, string>,
      filters: Array<any>
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
  };
};
