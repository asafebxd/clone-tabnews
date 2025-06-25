import database from "infra/database.js";

beforeAll(async () => {
  await database.query("drop schema public cascade; CREATE schema public;");
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving  pending migrations", async () => {
      const res = await fetch("http://localhost:3000/api/v1/migrations");
      expect(res.status).toBe(200);

      const resBody = await res.json();

      expect(Array.isArray(resBody)).toBe(true);
      expect(resBody.length).toBeGreaterThan(0);
    });
  });
});
