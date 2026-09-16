export type TrainingSuccessData = {
  status_code: number;
  message: string;
  data: {
    id: string;
    pipeline_name: string;
    order_id: string;
    status: string;
  };
};

export const parseTrainingRunResponse = (
  trainingResponse: unknown,
  orderId: string,
): TrainingSuccessData => {
  const response = trainingResponse as Record<string, unknown>;
  const cogData =
    (response.data as Record<string, unknown> | undefined) || response;

  return {
    status_code: (response.status_code as number) || 201,
    message:
      (response.message as string) || "Pipeline launched successfully",
    data: {
      id: String(cogData?.id ?? ""),
      pipeline_name: String(
        cogData?.pipeline_name ?? "FederatedLearningPipeline",
      ),
      order_id: orderId,
      status: String(cogData?.status ?? "RUNNING"),
    },
  };
};

export const createCheckoutOnlySuccessData = (
  orderId: string,
): TrainingSuccessData => ({
  status_code: 201,
  message: "Order created successfully",
  data: {
    id: "",
    pipeline_name: "",
    order_id: orderId,
    status: "CREATED",
  },
});
