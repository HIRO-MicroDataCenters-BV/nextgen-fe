export class CheckoutService {
  async processCheckout(
    datasets: Array<Record<string, unknown>>,
    application?: Record<string, unknown> | null,
  ) {
    if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No datasets provided",
      });
    }

    const typedDatasets = datasets.map((d) => {
      const regionValue = d.region as string;
      const region =
        regionValue && typeof regionValue === "string" && regionValue.trim()
          ? regionValue.trim()
          : "hus";

      let distribution =
        (d as Record<string, unknown>)["_original_dcat_distribution"] ||
        d["dcat:distribution"] ||
        d.distribution;

      if (!distribution) {
        distribution = [];
      } else if (!Array.isArray(distribution)) {
        distribution = [distribution];
      }

      if (!Array.isArray(distribution)) {
        distribution = [];
      }

      const datasetWithoutTempFields = { ...d };
      delete datasetWithoutTempFields._original_dcat_distribution;

      const datasetObj: Record<string, unknown> = {
        "@type": "dcat:Dataset",
        ...datasetWithoutTempFields,
        region: region,
        "dcat:distribution": distribution,
      };

      return datasetObj;
    });

    const payload = {
      "@context": {
        dcat: "http://www.w3.org/ns/dcat#",
        dcterms: "http://purl.org/dc/terms/",
      },
      "@type": "dcat:Catalog",
      "dcterms:title": "Marketplace Selection",
      "dcat:dataset": typedDatasets,
      application: application ?? null,
    };

    const config = useRuntimeConfig();
    const checkoutUrl = `${config.public.apiCheckoutServiceUrl}/orders`;

    try {
      const response = await $fetch<{
        order_id: string;
        expires_in_seconds: number;
      }>(checkoutUrl, {
        method: "POST",
        body: {
          data: payload,
        },
      });

      return {
        order_id: response.order_id,
        status: "created",
      };
    } catch (error: unknown) {
      const err = error as {
        data?: unknown;
        response?: { status?: number; _data?: unknown };
        message?: string;
      };
      const details = err.data || err.response?._data || err.message;
      throw createError({
        statusCode: err.response?.status || 500,
        statusMessage: "Failed to process checkout",
        data: details,
      });
    }
  }
}

export const checkoutService = new CheckoutService();
