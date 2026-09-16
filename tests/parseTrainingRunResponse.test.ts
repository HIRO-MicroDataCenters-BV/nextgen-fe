import { describe, expect, it } from "vitest";
import {
  createCheckoutOnlySuccessData,
  parseTrainingRunResponse,
} from "~/composables/catalog/parseTrainingRunResponse";

describe("parseTrainingRunResponse", () => {
  it("maps nested COG response fields", () => {
    const result = parseTrainingRunResponse(
      {
        status_code: 200,
        message: "OK",
        data: {
          id: "pipe-1",
          pipeline_name: "MyPipeline",
          status: "RUNNING",
        },
      },
      "order-42",
    );

    expect(result.data.order_id).toBe("order-42");
    expect(result.data.id).toBe("pipe-1");
    expect(result.data.pipeline_name).toBe("MyPipeline");
    expect(result.data.status).toBe("RUNNING");
  });

  it("creates checkout-only success payload", () => {
    const result = createCheckoutOnlySuccessData("order-99");
    expect(result.data.order_id).toBe("order-99");
    expect(result.data.status).toBe("CREATED");
    expect(result.data.id).toBe("");
  });
});
