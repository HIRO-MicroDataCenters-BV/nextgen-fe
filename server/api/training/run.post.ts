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
  } catch (error) {
    console.error("Error sending to COG:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to start training pipeline",
      data: error,
    });
  }
});
