import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { createApiRequest } from "~/composables/api/createApiRequest";

function setup(token: string | null) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  const { request } = createApiRequest({
    serviceUrls: { search: "http://search", catalog: "http://catalog", connector: "http://connector" },
    token: ref(token),
    toaster: { show: () => {} },
    t: (k) => k,
  });
  return { fetch, request };
}

describe("API requests carry the ds-login token", () => {
  it("adds Authorization: Bearer when signed in", async () => {
    const { fetch, request } = setup("a.b.c");
    await request("catalog", "/datasets/");
    const headers = fetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer a.b.c");
  });

  it("sends no Authorization header when signed out", async () => {
    const { fetch, request } = setup(null);
    await request("search", "/distributed-search/", "POST", {});
    const headers = fetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});
