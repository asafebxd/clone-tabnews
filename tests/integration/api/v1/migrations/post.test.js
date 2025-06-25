import orchestratror from "tests/orchestrator";

beforeAll(async () => {
  await orchestratror.clearDatabase();
  await orchestratror.waitForAllServices();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const res = await fetch("http://localhost:3000/api/v1/migrations", {
          method: "POST",
        });
        expect(res.status).toBe(201);

        const resBody = await res.json();

        expect(Array.isArray(resBody)).toBe(true);
        expect(resBody.length).toBeGreaterThan(0);
      });
      test("For the second time", async () => {
        const res = await fetch("http://localhost:3000/api/v1/migrations", {
          method: "POST",
        });
        expect(res.status).toBe(200);

        const resBody = await res.json();

        expect(Array.isArray(resBody)).toBe(true);
        expect(resBody.length).toBe(0);
      });
    });
  });
});
