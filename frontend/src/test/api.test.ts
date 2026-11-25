import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "../services/api";
afterEach(() => vi.unstubAllGlobals());
describe("HTTP client", () => {
  it("reads a 204 deletion without trying to parse JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await expect(
      request("/expenses/1", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });
  it("keeps Laravel field errors from a 422 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              message: "Datos inválidos",
              errors: { amount: ["Mayor que cero"] },
            }),
            { status: 422 },
          ),
        ),
    );
    await expect(request("/expenses")).rejects.toMatchObject({
      message: "Datos inválidos",
      errors: { amount: ["Mayor que cero"] },
    });
  });
  it("turns a connection failure into a readable error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Network failure")),
    );
    await expect(request("/expenses")).rejects.toThrow(
      "No se pudo conectar con Laravel.",
    );
  });
});
