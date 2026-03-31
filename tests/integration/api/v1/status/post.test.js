import orchestrator from "tests/orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const res = await fetch(`${webserver.origin}/api/v1/status`, {
        method: "POST",
      });
      expect(res.status).toBe(405);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Método não permitido para este endpoint.",
        action:
          "Verifique se o método HTTP enviado é valido para este endpoint",
        status_code: 405,
      });
    });
  });
});
