import type { Ref } from "vue";
import type { ApiError, ApiErrorDetail } from "~/types/api.types";

export type RequestError = { error: true; data: unknown };
export type ApiService = "search" | "catalog" | "connector";
export type RequestOptions = {
  showToast?: boolean;
  timeout?: number;
  hasRawData?: boolean;
  returnResponse?: boolean;
  returnErrorDetails?: boolean;
};

interface CreateApiRequestOptions {
  serviceUrls: Record<ApiService, string>;
  token: Ref<string | null>;
  toaster: { show: (type: string, message: string) => void };
  t: (key: string) => string;
}

const getHeaders = (isFormData = false) => {
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

const formatApiErrorMessage = (
  error: ApiError,
  fallbackMessage: string,
): string => {
  const detail = error.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as ApiErrorDetail;
    return first.message ?? first.code ?? fallbackMessage;
  }
  return fallbackMessage;
};

export const createApiRequest = (options: CreateApiRequestOptions) => {
  const request = async <T>(
    service: ApiService,
    url: string,
    method = "GET",
    body?: unknown,
    requestOptions?: RequestOptions,
  ) => {
    const baseUrl = options.serviceUrls[service];
    const isFormData = body instanceof FormData;
    const hasRawData = requestOptions?.hasRawData || false;
    const showToast = requestOptions?.showToast !== false;
    const timeout = requestOptions?.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions: RequestInit = {
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
      const res = await fetch(`${baseUrl}${url}`, fetchOptions);
      clearTimeout(timeoutId);

      let data = {};
      const text = await res.text();
      if (text !== "") {
        data = JSON.parse(text);
      }

      if (!res.ok) {
        const error = data as ApiError;
        const errorMessage = formatApiErrorMessage(
          error,
          options.t("app.error.occurred"),
        );

        if (res.status === 401) {
          options.token.value = null;
          if (showToast) {
            options.toaster.show("error", options.t("app.error.unauthorized"));
          }
          return requestOptions?.returnErrorDetails
            ? ({ error: true as const, data } satisfies RequestError)
            : null;
        }

        if (showToast) {
          options.toaster.show("error", errorMessage);
        }
        return requestOptions?.returnErrorDetails
          ? ({ error: true as const, data } satisfies RequestError)
          : null;
      }

      if (isFormData && (res.status === 201 || res.status === 200)) {
        const locationHeader = res.headers.get("Location");
        if (locationHeader) return locationHeader as T;

        if (data && typeof data === "object" && "Location" in data) {
          return (data as { Location: string }).Location as T;
        }

        if (body instanceof FormData) {
          const file = body.get("file") as File;
          if (file) return file.name as T;
        }
      }

      if (requestOptions?.returnResponse) {
        return { data: data as T, response: res } as unknown as T & {
          response: Response;
        };
      }

      return data as T;
    } catch (err) {
      // Return null (not undefined) so DELETE callers using `response !== null`
      // correctly detect a network/abort failure instead of reading it as success.
      if (method === "DELETE") return null;

      if (err instanceof Error && err.name === "AbortError") {
        if (showToast) {
          options.toaster.show("error", options.t("app.error.timeout"));
        }
        return null;
      }

      if (showToast) {
        options.toaster.show("error", options.t("app.error.fetch"));
      }
      return null;
    }
  };

  return { request };
};
