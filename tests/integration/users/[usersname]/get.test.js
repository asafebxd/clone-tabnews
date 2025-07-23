import orchestratror from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestratror.clearDatabase();
  await orchestratror.waitForAllServices();
  await orchestratror.runPendingMigrations();
});

describe("GET /api/v1/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      await orchestratror.createUser({
        username: "MesmoCase",
        email: "MesmoCase@teste.com",
        password: "teste123",
      });

      const res2 = await fetch("http://localhost:3000/api/v1/users/MesmoCase");
      expect(res2.status).toBe(200);

      const res2Body = await res2.json();

      expect(res2Body).toEqual({
        id: res2Body.id,
        username: "MesmoCase",
        email: "MesmoCase@teste.com",
        password: res2Body.password,
        created_at: res2Body.created_at,
        updated_at: res2Body.updated_at,
      });

      expect(uuidVersion(res2Body.id)).toBe(4);
      expect(Date.parse(res2Body.created_at)).not.toBeNaN();
      expect(Date.parse(res2Body.updated_at)).not.toBeNaN();
    });

    test("With case missmatch", async () => {
      await orchestratror.createUser({
        username: "CaseDiferente",
        email: "case.diferente@teste.com",
        password: "teste123",
      });

      const res2 = await fetch(
        "http://localhost:3000/api/v1/users/casediferente",
      );
      expect(res2.status).toBe(200);

      const res2Body = await res2.json();

      expect(res2Body).toEqual({
        id: res2Body.id,
        username: "CaseDiferente",
        email: "case.diferente@teste.com",
        password: res2Body.password,
        created_at: res2Body.created_at,
        updated_at: res2Body.updated_at,
      });

      expect(uuidVersion(res2Body.id)).toBe(4);
      expect(Date.parse(res2Body.created_at)).not.toBeNaN();
      expect(Date.parse(res2Body.updated_at)).not.toBeNaN();
    });

    test("With nonexistent username", async () => {
      const res = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
      );
      expect(res.status).toBe(404);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username foi digitando corretamente",
        status_code: 404,
      });
    });
  });
});
