export default defineEventHandler(async (event) => {
  console.log("[server/api/training/run.post.ts] Request received");
  const config = useRuntimeConfig();
  const body = await readBody(event);
  console.log(
    "[server/api/training/run.post.ts] Request body:",
    JSON.stringify(body, null, 2)
  );
  const { datasets } = body;

  if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
    console.error("[server/api/training/run.post.ts] No datasets provided");
    throw createError({
      statusCode: 400,
      statusMessage: "No datasets provided",
    });
  }

  console.log(
    "[server/api/training/run.post.ts] Processing",
    datasets.length,
    "datasets"
  );
  console.log(
    "[server/api/training/run.post.ts] Datasets data:",
    JSON.stringify(datasets, null, 2)
  );

  // Extract ALL data from real datasets
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

  // Build payload using ONLY real data from datasets - NO MOCKS!
  const firstDataset = datasets[0] as Record<string, unknown>;

  const payload = {
    name:
      (firstDataset.title as string) ||
      (firstDataset.identifier as string) ||
      "FederatedLearningPipeline",
    datasets: datasets, // Pass ALL real datasets
    datasetIds: datasetIds, // Comma-separated identifiers for local_data_connector
    input_path: [
      {
        name: "local_data_connector",
        type: "String",
        default: datasetIds,
      },
    ],
    order_id: crypto.randomUUID(),
  };

  try {
    // COG API endpoint according to documentation:
    // POST https://dashboard.cog.hiro-develop.nl/apidev/training-builder-pipelines/dataspace/federated/run
    const cogEndpoint = `${config.public.apiCogUrl}/training-builder-pipelines/dataspace/federated/run`;
    console.log(
      "[server/api/training/run.post.ts] Sending request to COG:",
      cogEndpoint
    );
    console.log(
      "[server/api/training/run.post.ts] Payload:",
      JSON.stringify(payload, null, 2)
    );
    const response = await $fetch(cogEndpoint, {
      method: "POST",
      body: payload,
    });
    console.log(
      "[server/api/training/run.post.ts] COG response:",
      JSON.stringify(response, null, 2)
    );
    return response;
  } catch (error: unknown) {
    // Extract all available error information from COG API response
    const errorDetails: Record<string, unknown> = {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    };

    // Extract FetchError details if available
    if (error && typeof error === "object") {
      const fetchError = error as Record<string, unknown>;
      
      // Status code from COG API
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

      // Response body from COG API
      if (fetchError.response) {
        errorDetails.response = fetchError.response;
      }
      if (fetchError.data) {
        errorDetails.data = fetchError.data;
      }
      if (fetchError.responseBody) {
        errorDetails.responseBody = fetchError.responseBody;
      }

      // Request details
      if (fetchError.request) {
        errorDetails.request = fetchError.request;
      }
      if (fetchError.url) {
        errorDetails.url = fetchError.url;
      }

      // Additional error info
      if (fetchError.cause) {
        errorDetails.cause = fetchError.cause;
      }
      if (fetchError.stack) {
        errorDetails.stack = fetchError.stack;
      }

      // Copy all other properties
      Object.keys(fetchError).forEach((key) => {
        if (!errorDetails[key]) {
          errorDetails[key] = fetchError[key];
        }
      });
    }

    console.error(
      "[server/api/training/run.post.ts] COG API error details:",
      JSON.stringify(errorDetails, null, 2)
    );

    throw createError({
      statusCode: (errorDetails.statusCode as number) || 500,
      statusMessage: "Failed to start training pipeline",
      data: errorDetails,
    });
  }
});
