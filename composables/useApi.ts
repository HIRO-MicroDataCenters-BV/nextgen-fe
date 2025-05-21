import {
  apiErrorResponseSchema,
  apiResponseSchema,
} from "~/schemas/response.schema";

/**
 * Fetch data from the API
 * @returns returns the API object
 */
export const useApi = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase;
  const accessTokenKey = "access_token";
  const token = useLocalStorage(accessTokenKey, null);

  /**
   * Function to get headers
   * @param isFormData
   * @returns
   */
  const getHeaders = (isFormData: boolean = false) => {
    const headers: { "Content-Type"?: string; Authorization?: string } = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    if (token.value) {
      headers["Authorization"] = `Bearer ${token.value}`;
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
  const request = async (
    url: string,
    method: string = "GET",
    body?: unknown,
    options?: { showToast?: boolean }
  ) => {
    const isFormData = body instanceof FormData;
    const showToast = options?.showToast !== false;
    //const toaster = useToaster();

    const opts: RequestInit = {
      method,
      headers: getHeaders(isFormData),
      ...(method !== "DELETE" &&
        method !== "GET" && { body: isFormData ? body : JSON.stringify(body) }),
    };

    try {
      const res = await fetch(`${baseUrl}${url}`, opts);
      const data = await res.json();
      if (!res.ok) {
        switch (res.status) {
          case 401:
            //useLocalStorage(accessTokenKey, null);
            token.value = null;
            //if (showToast) toaster.show('error', 'unauthorized');
            return null;
        }
      }

      const result =
        res.status >= 400 && res.status < 600
          ? apiErrorResponseSchema.parse(data)
          : apiResponseSchema.parse(data);
      return result;
    } catch (err) {
      if (method === "DELETE") {
        return;
      } else {
        console.error("Fetch error:", err);
        //if (showToast) toaster.show('error', 'connection_error');
        throw err;
      }
    }
  };

  return {
    healthCheck: async () => {
      return request(`/health`);
    },
  };
};
