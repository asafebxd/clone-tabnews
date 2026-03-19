import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.waitForAllServices();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving  pending migrations", async () => {
      const res = await fetch("http://localhost:3000/api/v1/migrations");
      expect(res.status).toBe(403);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:migration"',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving  pending migrations", async () => {
      const createdUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const res = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(res.status).toBe(403);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:migration"',
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Retrieving  pending migrations", async () => {
      const privilegedUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(privilegedUser);
      await orchestrator.addFeaturesToUser(privilegedUser, ["read:migration"]);
      const privilegedUserSession = await orchestrator.createSession(
        activatedUser.id,
      );

      const res = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      expect(res.status).toBe(200);

      const resBody = await res.json();

      expect(Array.isArray(resBody)).toBe(true);
    });
  });
});
