import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.waitForAllServices();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique 'username'", async () => {
      const user1 = await orchestrator.createUser({
        username: "newUniqueUser1",
      });

      const res = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "newUniqueUser",
          }),
        },
      );

      expect(res.status).toBe(403);

      const resBody = await res.json();

      expect(resBody).toEqual({
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent 'username'", async () => {
      const createdUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const res = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
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

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const res = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });
      expect(res.status).toBe(400);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "ValidationError",
        message: "O nome de usuario informado já está sendo utilizado.",
        action: "Utilize outro nome de usuario para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With 'target2' targeting 'target1'", async () => {
      await orchestrator.createUser({
        username: "target1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "target2",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const res = await fetch("http://localhost:3000/api/v1/users/target1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
        },
        body: JSON.stringify({
          username: "target3",
        }),
      });
      expect(res.status).toBe(403);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para atualizar outro usuário.",
        action:
          "Verifique se você possui a feature necessária para atualizar outro usuário.",
        status_code: 403,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@teste1.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@teste1.com",
      });

      const activatedUser = await orchestrator.activateUser(createdUser2);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const res = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "email1@teste1.com",
          }),
        },
      );
      expect(res.status).toBe(400);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const user1 = await orchestrator.createUser({
        username: "uniqueUser1",
      });

      const activatedUser = await orchestrator.activateUser(user1);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const res = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      expect(res.status).toBe(200);

      const resBody = await res.json();

      expect(resBody).toEqual({
        id: resBody.id,
        username: "uniqueUser2",
        email: user1.email,
        features: ["create:session", "read:session", "update:user"],
        password: resBody.password,
        created_at: resBody.created_at,
        updated_at: resBody.updated_at,
      });

      expect(uuidVersion(resBody.id)).toBe(4);
      expect(Date.parse(resBody.created_at)).not.toBeNaN();
      expect(Date.parse(resBody.updated_at)).not.toBeNaN();

      expect(resBody.updated_at > resBody.created_at).toBe(true);
    });

    test("With unique 'email", async () => {
      const user1 = await orchestrator.createUser({
        email: "uniqueEmail1@teste1.com",
      });

      const activatedUser = await orchestrator.activateUser(user1);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const res = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "uniqueEmail2@teste1.com",
          }),
        },
      );

      expect(res.status).toBe(200);

      const resBody = await res.json();

      expect(resBody).toEqual({
        id: resBody.id,
        username: user1.username,
        email: "uniqueEmail2@teste1.com",
        password: resBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: resBody.created_at,
        updated_at: resBody.updated_at,
      });

      expect(uuidVersion(resBody.id)).toBe(4);
      expect(Date.parse(resBody.created_at)).not.toBeNaN();
      expect(Date.parse(resBody.updated_at)).not.toBeNaN();

      expect(resBody.updated_at > resBody.created_at).toBe(true);
    });

    test("With new 'password", async () => {
      const user1 = await orchestrator.createUser({
        password: "newPassword1",
      });

      const activatedUser = await orchestrator.activateUser(user1);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const res = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );

      expect(res.status).toBe(200);

      const resBody = await res.json();

      expect(resBody).toEqual({
        id: resBody.id,
        username: user1.username,
        email: user1.email,
        password: resBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: resBody.created_at,
        updated_at: resBody.updated_at,
      });

      expect(uuidVersion(resBody.id)).toBe(4);
      expect(Date.parse(resBody.created_at)).not.toBeNaN();
      expect(Date.parse(resBody.updated_at)).not.toBeNaN();

      expect(resBody.updated_at > resBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(user1.username);
      const correctPasswordMatch = await password.compare(
        "newPassword2",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "newPassword1",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("Privileged User", () => {
    test("With `ùpdate:user:others` targeting `deafaultUser`", async () => {
      const privilegedUser = await orchestrator.createUser({});
      const activatedPrivilegedUser =
        await orchestrator.activateUser(privilegedUser);
      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);
      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser.id,
      );

      const defaultUser = await orchestrator.createUser({});

      const res = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: "AlteradoPorPrivilegedUser",
          }),
        },
      );
      expect(res.status).toBe(200);

      const resBody = await res.json();

      expect(resBody).toEqual({
        id: resBody.id,
        username: "AlteradoPorPrivilegedUser",
        email: defaultUser.email,
        features: defaultUser.features,
        password: resBody.password,
        created_at: resBody.created_at,
        updated_at: resBody.updated_at,
      });

      expect(uuidVersion(resBody.id)).toBe(4);
      expect(Date.parse(resBody.created_at)).not.toBeNaN();
      expect(Date.parse(resBody.updated_at)).not.toBeNaN();

      expect(resBody.updated_at > resBody.created_at).toBe(true);
    });
  });
});
