import { getDexSessionCookie } from "~/server/utils/dex-auth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const { datasets, order_id } = body;

  if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No datasets provided",
    });
  }

  if (!order_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "No order_id provided",
    });
  }

  const datasetIds = datasets
    .map((d: Record<string, unknown>) => {
      return (
        (d.identifier as string) ||
        (d["@id"] as string) ||
        (d.id as string) ||
        ""
      );
    })
    .filter((id: string) => id.length > 0)
    .join(",");

  if (!datasetIds) {
    throw createError({
      statusCode: 400,
      statusMessage: "No valid dataset identifiers found",
    });
  }

  const firstDataset = datasets[0] as Record<string, unknown>;

  const payload: Record<string, unknown> = {
    name:
      (firstDataset.title as string) ||
      (firstDataset.identifier as string) ||
      "FederatedLearningPipeline",
    datasets: datasets,
    datasetIds: datasetIds,
    order_id: order_id,
  };

  if (firstDataset.pipeline_components) {
    payload.pipeline_components = firstDataset.pipeline_components;
  } else {
    payload.pipeline_components = [];
  }

  if (firstDataset.input_path) {
    payload.input_path = firstDataset.input_path;
  } else {
    payload.input_path = [];
  }

  if (firstDataset.output_path) {
    payload.output_path = firstDataset.output_path;
  } else {
    payload.output_path = [];
  }

  try {
    const apiCogUrl = config.public.apiCogURL;

    if (!apiCogUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: "COG API URL is not configured",
        data: {
          error: "apiCogURL is missing in runtime config",
        },
      });
    }

    const cookieHeader = await getDexSessionCookie();
    const cogEndpoint = `${apiCogUrl}/training-builder-pipelines/dataspace/federated/run`;

    const response = await $fetch(cogEndpoint, {
      method: "POST",
      body: payload,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      timeout: 60000,
    });

    return response;
  } catch (error: unknown) {
    const errorDetails: Record<string, unknown> = {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    };

    if (error && typeof error === "object") {
      const fetchError = error as Record<string, unknown>;

      if (fetchError.statusCode) {
        errorDetails.statusCode = fetchError.statusCode;
      }
      if (fetchError.status) {
        errorDetails.status = fetchError.status;
      }
      if (fetchError.statusMessage) {
        errorDetails.statusMessage = fetchError.statusMessage;
      }
      if (fetchError.statusText) {
        errorDetails.statusText = fetchError.statusText;
      }

      if (fetchError.response) {
        errorDetails.response = fetchError.response;
      }
      if (fetchError.data) {
        errorDetails.data = fetchError.data;
      }
      if (fetchError.responseBody) {
        errorDetails.responseBody = fetchError.responseBody;
      }
      if (fetchError.responseData) {
        errorDetails.responseData = fetchError.responseData;
      }

      if (fetchError.request) {
        errorDetails.request = fetchError.request;
      }
      if (fetchError.url) {
        errorDetails.url = fetchError.url;
      }

      if (fetchError.cause) {
        errorDetails.cause = fetchError.cause;
      }
      if (fetchError.stack) {
        errorDetails.stack = fetchError.stack;
      }
      if (fetchError.name) {
        errorDetails.name = fetchError.name;
      }

      Object.keys(fetchError).forEach((key) => {
        if (!errorDetails[key]) {
          try {
            errorDetails[key] = fetchError[key];
          } catch {
            
          }
        }
      });
    }

    throw createError({
      statusCode: (errorDetails.statusCode as number) || 500,
      statusMessage: "Failed to start training pipeline",
      data: errorDetails,
    });
  }
});
