import orchestrator from "tests/orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const res = await fetch(`${webserver.origin}/api/v1/status`);
      expect(res.status).toBe(200);

      const resBody = await res.json();

      const parsedUpdatedAt = new Date(resBody.updated_at).toISOString();
      expect(resBody.updated_at).toEqual(parsedUpdatedAt);
      expect(resBody.dependencies.database).not.toHaveProperty("version");
      expect(resBody.dependencies.database.max_connections).toEqual(100);
      expect(resBody.dependencies.database.opened_connections).toEqual(1);
    });
  });

  describe("Default user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);
      const res = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(res.status).toBe(200);

      const resBody = await res.json();

      const parsedUpdatedAt = new Date(resBody.updated_at).toISOString();
      expect(resBody.updated_at).toEqual(parsedUpdatedAt);
      expect(resBody.dependencies.database).not.toHaveProperty("version");
      expect(resBody.dependencies.database.max_connections).toEqual(100);
      expect(resBody.dependencies.database.opened_connections).toEqual(1);
    });
  });

  describe("Privileged user", () => {
    test("Retrieving current system status", async () => {
      const privilegedUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(privilegedUser);
      await orchestrator.addFeaturesToUser(privilegedUser, ["read:status:all"]);
      const privilegedUserSession = await orchestrator.createSession(
        activatedUser.id,
      );

      const res = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${privilegedUserSession.token}`,
        },
      });
      expect(res.status).toBe(200);

      const resBody = await res.json();

      const parsedUpdatedAt = new Date(resBody.updated_at).toISOString();
      expect(resBody.updated_at).toEqual(parsedUpdatedAt);
      expect(resBody.dependencies.database.version).toEqual("16.8");
      expect(resBody.dependencies.database.max_connections).toEqual(100);
      expect(resBody.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
