import database from "infra/database.js";

beforeAll(async () => {
  await database.query("drop schema public cascade; create schema public;");
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
